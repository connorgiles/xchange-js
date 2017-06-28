const EventEmitter = require('events').EventEmitter;
const Websocket = require('ws');
// const Utils = require('../../util');
const util = require('util');
const _  = require('lodash');
const Market = require('../../market')


var WebsocketClient = function(websocketURI, auth) {
	let self = this;

	self.websocketURI = websocketURI || 'wss://api.bitfinex.com/ws';
	self.markets = {}

	if (auth && !(auth.secret && auth.key)) {
		throw new Error('Invalid or incomplete authentication credentials. You should either provide all of the secret, key and passphrase fields, or leave auth null');
	}
	else if (auth) {
		let authNonce = Date.now() * 1000;
		let authPayload = 'AUTH' + authNonce;
		let authSig = crypto
		.HmacSHA384(authPayload, auth.secret)
		.toString(crypto.enc.Hex);
		self.auth = {
			apiKey: auth.key,
			authSig,
			authNonce,
			authPayload,
			event: 'auth'
		};
	}
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

		self.socket = new Websocket(self.websocketURI);

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

		self.socket.close();
	};

	prototype.subscribe = function(pair) {
		let self = this;
		//
		// TODO: Check pair is valid
		//
		
		// If pair already exists return
		if (self.markets[pair]) return;

		self.socket.send(JSON.stringify({ event: 'subscribe', channel: 'book', pair: pair, prec: 'P0' }));
		self.markets[pair] = new Market(pair);
		return self.markets[pair];
	};

	prototype.unsubscribe = function(pair) {
		let self = this;
		if (!self.markets[pair] || !self.markets[pair].channelId) return;
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

	prototype.onMessage = function(data) {
		let self = this;
		data = JSON.parse(data);

		if (data.event) {
			if (data.channel === 'book' && data.event === 'subscribed' && data.pair && self.markets[data.pair]) {
				self.markets[data.pair].channelId = data.chanId;
				self.emit('susubscribed', data.pair);
			}
			return;
		}
		if (data[1] === 'hb') return;

		let p = _.find(self.markets, m => m.channelId === data[0]);

		if (!p) return;

		if (p.book.seq === 0) {
			_.each(data[1], (pp) => {
				pp = parseLevel(pp)
				let side = pp.amount >= 0 ? 'bids' : 'asks'
				pp.amount = Math.abs(pp.amount)
				p.book[side][pp.price] = pp
			})
		} 
		else {
			let pp = parseLevel(data[1])
			if (!pp.cnt) {
				let found = true
				if (pp.amount > 0) {
					if (p.book['bids'][pp.price]) {
						delete p.book['bids'][pp.price]
					} else {
						found = false
					}
				} 
				else if (pp.amount < 0) {
					if (p.book['asks'][pp.price]) {
						delete p.book['asks'][pp.price]
					} else {
						found = false
					}
				}
				if (!found) {
					console.error(conf.logs, "[" + moment().format() + "] " + pair + " | " + JSON.stringify(pp) + " BOOK delete fail side not found\n")
				}
			} 
			else {
				let side = pp.amount >= 0 ? 'bids' : 'asks'
				pp.amount = Math.abs(pp.amount)
				p.book[side][pp.price] = pp
			}
		}

		p.book.seq++

		self.emit('message', data);
	};

	prototype.onError = function(err) {
		let self = this;

		if (!err) {
			return;
		}

		if (err.message === 'unexpected server response (429)') {
			err = new Error('You are connecting too fast and are being throttled! Make sure you subscribe to multiple books on one connection.');
			throw err;
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
 	return {price: msg[0], cnt: msg[1], amount: msg[2]}
 }

 module.exports = exports = WebsocketClient;