'use strict';
const EventEmitter = require('events').EventEmitter;
const Websocket = require('ws');
const util = require('util');
const path = require('path');
const _  = require('lodash');
const normalize = require('./normalize');
const Market = require('../../market');
const PublicClient = require('./public');


var WebsocketClient = function(websocketURI, options) {
	let self = this;

	self.websocketURI = websocketURI || 'wss://api2.poloniex.com';
	self.options = options || {};
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

		self.socket = new Websocket(self.websocketURI);
		self.heartbeat = Date.now() + 4000;

		self.socket.on('message', self.onMessage.bind(self));
		self.socket.on('open', self.onOpen.bind(self));
		self.socket.on('close', self.onClose.bind(self));
		self.socket.on('error', self.onError.bind(self));
	};

	prototype.disconnect = function() {
		let self = this;

		if (!self.socket) {
			throw 'Could not disconnect (not connected)'
		}

		clearInterval(self._keepAliveInterval);
		self.socket.close();
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

		self.socket.send(JSON.stringify({ command: 'subscribe', channel: normalize.pair(pair, true)}));
		let exchange = path.basename(__dirname);
		self.markets[pair] = new Market(pair, exchange);
		return self.markets[pair];
	};

	prototype.unsubscribe = function(pair) {
		let self = this;
		if (!self.markets[pair] || !self.markets[pair].channelId) return;
		self.socket.send(JSON.stringify({ command: 'unsubscribe', channel: normalize.pair(pair, true)}));
	};

	prototype.onOpen = function() {
		let self = this;

		self.heartbeat = Date.now();
		self._keepAliveInterval = setInterval(() => {self.socket.send(".")}, 60000);

		self.emit('open');
	};

	prototype.onClose = function() {
		let self = this;
		self.socket = null;
		self.emit('close');
	};

	prototype.onMessage = function(data) {
		let self = this;

		self.heartbeat = Date.now();

		if (data.length === 0) {
			throw new Error('Empty data');
		}

		data = JSON.parse(data);

		if ('error' in data) {
			return this.emit('error', data);
		}

		let cid = data[0];
		let sequence = data[1];

		// Detect unsubscribe
		if (sequence === 0) {
			let pair = _.findKey(self.markets, m => m.channelId === cid);
			self.emit('unsubscribe', pair);
			delete self.markets[pair];
			return;
		}

		// heartbeat
		if (cid === 1010) return;
		else if (0 >= cid || cid >= 1000) {
			return self.onError('Wrong channel number', cid);
		}


		_.each(data[2], d => {
			if (d[0] === 'i' && d[1] && d[1].currencyPair) {
				let p = self.markets[normalize.pair(d[1].currencyPair)]
				p.channelId = cid;
				p.book.seq = sequence;
				if (!d[1].orderBook) return;

				_.forIn(d[1].orderBook[1], (amount, price) => {
					let pp = parseLevel([price, amount]);
					p.book.bids[pp.price] = pp;
				});
				_.forIn(d[1].orderBook[0], (amount, price) => {
					let pp = parseLevel([price, amount]);
					p.book.asks[pp.price] = pp;
				});
				self.emit('change', p)
			}
			else if (d[0] === 'o') {
				let p = _.find(self.markets, m => m.channelId === cid);
				// Check for errors
				if (!p) return;
				if (p.book.seq >= sequence) {
					let info = {orderSeq: sequence, marketSeq: p.book.seq};
      				return self.onError('Wrong sequence number', info);
				}
				// Create the order and add it to the book
				let side = d[1] === 0 ? 'asks' : 'bids';
				let pp = parseLevel(_.slice(d, 2,4));
				if (pp.amount === 0) delete p.book[side][pp.price];
				else p.book[side][pp.price] = pp;
				self.emit('change', p)
			}
		});
		self.emit('message', data);
	};

	prototype.onError = function(err) {
		let self = this;

		if (!err) {
			return;
		}

		self.emit('error', err);
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

 module.exports = exports = WebsocketClient;