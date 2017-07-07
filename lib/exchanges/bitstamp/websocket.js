const EventEmitter = require('events').EventEmitter;
const Pusher = require('pusher-js')
const util = require('util');
const path = require('path');
const _  = require('lodash');
const adapters = require('./adapters');
const Market = require('../../market');
const PublicClient = require('./public');


var WebsocketClient = function(raw=true, pushKey='de504dc5763aeef9ff52', encrypted=true) {
	let self = this;

	self.pushKey = pushKey;
	self.raw = raw;
	self.encrypted = encrypted;
	self.markets = {};

	self._queues = {};

	EventEmitter.call(self);

	self.supportedPairs = [];
	self.publicClient = new PublicClient();
	self.publicClient.pairs().then(pairs => {
		self.connect();
		self.supportedPairs = pairs
	});
};

util.inherits(WebsocketClient, EventEmitter);

_.assign(WebsocketClient.prototype, new function() {
	let prototype = this;

	prototype.connect = function() {
		let self = this;

		if (self.socket) {
			self.socket.close();
		}

		self.socket = new Pusher(self.pushKey, {
			encrypted: self.encrypted
		});

		self.socket.connection.bind('connected', self.onOpen.bind(self));
		self.socket.connection.bind('disconnected', self.onClose.bind(self));
	};

	prototype.disconnect = function() {
		let self = this;

		if (!self.socket) {
			throw 'Could not disconnect (not connected)'
		}

		self.socket.disconnect();
	};

	prototype.subscribe = function(pair) {
		let self = this;

		// Pair is not supported
		if (_.indexOf(self.supportedPairs, pair) === -1) {
			console.error('Pair', pair, 'not supported');
			throw new Error('Pair not supported');
		}
		
		// If pair already exists return
		if (self.markets[pair]) return;

		let channel = self.socket.subscribe(adapters.socketChannel(pair, self.raw));

		if (self.raw) {
			channel.bind('order_created', self.onMessage.bind(self, pair, 'order_created'));
			channel.bind('order_changed', self.onMessage.bind(self, pair, 'order_changed'));
			channel.bind('order_deleted', self.onMessage.bind(self, pair, 'order_deleted'));
		} else {
			channel.bind('data', self.onMessage.bind(self, pair, 'data'));
		}

		let exchange = path.basename(__dirname);
		self.markets[pair] = new Market(pair, exchange);

		// Start loading book
		if (!self.raw) self.loadOrderbook.bind(self)(pair);

		return self.markets[pair];
	};

	prototype.loadOrderbook = function(pair) {
		let self = this;

		self.markets[pair].book.loading = true;
		self._queues[pair] = [];

		console.log('Loading orderbook');

		self.publicClient.orderbook(pair, 3, self.markets[pair]).then(m => {
			while (self._queues[pair].length > 0) {
				self.onMessage.bind(self)(self._queues[pair].shift(), 'data', true);
			}
			self.markets[pair].book.loading = false;
			console.log('Orderbook loaded');
			return;
		}).catch(err => {
			self.onError.bind(self)(err);
			console.error('Error loading - trying again');
			self.loadOrderbook.bind(self)(pair);
			return;
		});
	};

	prototype.unsubscribe = function(pair) {
		let self = this;
		if (!self.markets[pair] || !self.markets[pair].channelId) return;
		self.socket.unsubscribe(adapters.socketChannel(pair, self.raw));
		delete self.markets[pair];
	};

	prototype.onOpen = function() {
		let self = this;
		self.emit('open');
	};

	prototype.onClose = function() {
		let self = this;
		self.socket = null;
		self.emit('close');
	};

	prototype.onMessage = function(pair, event, data, filling) {
		let self = this;
		let p = self.markets[pair];
		if (!p) return;

		if (p.book.loading && !filling) {
			self._queues[pair].push(data);
			return;
		}

		let pp = adapters.socketPriceLevel(data, self.raw);

		if (event === 'data') {
			_.each(data.asks, ask => {
				ask.push('ask');
				pp = adapters.socketPriceLevel(ask, self.raw);
				if (pp.amount === 0) p.book.remove(pp.id);
				else if (!p.book.get(pp.id)) p.book.add(pp);
				else p.book.change(pp);
			});
			_.each(data.bids, bid => {
				bid.push('bid');
				pp = adapters.socketPriceLevel(bid, self.raw);
				if (pp.amount === 0) p.book.remove(pp.id);
				else if (!p.book.get(pp.id)) p.book.add(pp);
				else p.book.change(pp);
			});
		}
		else if (event === 'order_created') p.book.add(pp);
		else if (event === 'order_changed') p.book.change(pp);
		else if (event === 'order_deleted') p.book.remove(pp.id);

		p.book.seq++
		self.emit('change', p)
		self.emit('message', data);
	};

	prototype.onError = function(err) {
		let self = this;
		if (!err) return;
		self.emit('error', err);
	};

});

module.exports = exports = WebsocketClient;