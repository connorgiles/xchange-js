const EventEmitter = require('events').EventEmitter;
const Pusher = require('pusher-js')
// const Utils = require('../../util');
const util = require('util');
const _  = require('lodash');
const Market = require('../../market')


var WebsocketClient = function(pushKey, encrypted) {
	let self = this;

	self.pushKey = pushKey || 'de504dc5763aeef9ff52';
	self.encrypted = encrypted != null ? encrypted : true;
	self.markets = {}

	EventEmitter.call(self);
	self.connect();
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
		//
		// TODO: Check pair is valid
		//
		
		// If pair already exists return
		if (self.markets[pair]) return;

		let channel = self.socket.subscribe(normalizePair(pair));
		channel.bind('data', self.onMessage.bind(self, pair));

		self.markets[pair] = new Market(pair);
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

		// Subscribe if user passed valid auth values
		if (self.auth) {
			self.socket.send(JSON.stringify(self.auth))
		}

		self.emit('open');
	};

	prototype.onClose = function() {
		let self = this;
		self.socket = null;
		self.emit('close');
	};

	prototype.onMessage = function(pair, data) {
		let self = this;
		let p = self.markets[pair];
		if (!p) return;

		_.forIn(data, (orders, side) => {
			p.book[side] = {}
			_.each(orders, (pp) => {
				pp = parseLevel(pp)
				p.book[side][pp.price] = pp
			})
		})

		p.book.seq++
		
		self.emit('message', data);
	};

});

/**
 * Parse a price level of the orderbook
 * @param  {array} msg array of price data
 * @return {object}     normalized object of price level
 */
 function parseLevel(msg) {
 	return {price: parseFloat(msg[0]), amount: parseFloat(msg[1])}
 }

/**
 * Helper function to normalize the channel name of a pair
 * @param  {string} pair pair to get channel for
 * @return {string}      channel name for pair
 */
 function normalizePair(pair) {
 	return 'order_book' + (pair === 'BTCUSD' ? '' : '_' + pair.toLowerCase())
 }

 module.exports = exports = WebsocketClient;