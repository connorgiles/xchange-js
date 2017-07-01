const EventEmitter = require('events').EventEmitter;
const Pusher = require('pusher-js')
const util = require('util');
const path = require('path');
const _  = require('lodash');
const Market = require('../../market');
const PublicClient = require('./public');


var WebsocketClient = function(pushKey, encrypted) {
	let self = this;

	self.pushKey = pushKey || 'de504dc5763aeef9ff52';
	self.encrypted = encrypted != null ? encrypted : true;
	self.markets = {};

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

		let channel = self.socket.subscribe(normalizePair(pair));
		channel.bind('order_created', self.onMessage.bind(self, pair, 'order_created'));
		channel.bind('order_changed', self.onMessage.bind(self, pair, 'order_changed'));
		channel.bind('order_deleted', self.onMessage.bind(self, pair, 'order_deleted'));
		let exchange = path.basename(__dirname);
		self.markets[pair] = new Market(pair, exchange);
		return self.markets[pair];
	};

	prototype.unsubscribe = function(pair) {
		let self = this;
		if (!self.markets[pair] || !self.markets[pair].channelId) return;
		self.socket.unsubscribe(normalizePair(pair));
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

	prototype.onMessage = function(pair, event, data) {
		let self = this;
		let p = self.markets[pair];
		if (!p) return;

		let pp = parseLevel(data);

		if (event === 'order_created') p.book.add(pp);
		else if (event === 'order_changed') p.book.change(pp);
		else if (event === 'order_deleted') p.book.remove(pp.id);

		p.book.seq++
		self.emit('change', p)
		self.emit('message', data);
	};

});

/**
 * Parse a price level of the orderbook
 * @param  {array} msg array of price data
 * @return {object}     normalized object of price level
 */
 function parseLevel(msg) {
 	return {
 		price: msg.price,
 		amount: msg.amount,
 		time: parseInt(msg.datetime),
 		id: msg.id,
 		type: msg.order_type === 0 ? 'bid' : 'ask'
 	}
 }

/**
 * Helper function to normalize the channel name of a pair
 * @param  {string} pair pair to get channel for
 * @return {string}      channel name for pair
 */
 function normalizePair(pair) {
 	return 'live_orders' + (pair === 'BTCUSD' ? '' : '_' + pair.toLowerCase())
 }

 module.exports = exports = WebsocketClient;