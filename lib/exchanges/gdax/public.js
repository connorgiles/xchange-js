const _  = require('lodash');
const parsers = require('../../util/parsers');
const Market = require('../../market');
const path = require('path');
const normalize = require('./normalize');

const headers = {
	'User-Agent': 'xchange-js',
	'Accept': 'application/json',
	'Content-Type': 'application/json'
}

var PublicClient = function(publicURI) {
	let self = this;
	self.publicURI = publicURI || 'https://api.gdax.com';
};

_.assign(PublicClient.prototype, new function() {
	let prototype = this;
	
	prototype.ticker = function (pair, cb) {
		let self = this;
		pair = normalize.pair(pair, true);
		return parsers.request({
			uri: `${self.publicURI}/products/${pair}/ticker`,
			json: true,
			headers: headers,
			transform: body => {
				return {
					last: parseFloat(body.price),
					high: undefined,
					low: undefined,
					bid: parseFloat(body.bid),
					ask: parseFloat(body.ask),
					volume: parseFloat(body.volume),
					time: new Date(body.time)
				};
			}
		}, cb);
	};

	prototype.pairs = function (cb) {
		let self = this;

		return parsers.request({
			uri: `${self.publicURI}/products`,
			json: true,
			headers: headers,
			transform: body => body.map(b=>normalize.pair(b.id))
		}, cb);
	};

	prototype.trades = function (pair, start, cb) {
		let self = this;
		if (typeof(start) == 'function') {
			cb = start;
			start = undefined;
		}
		return parsers.request({
			uri: `${self.publicURI}/products/${normalize.pair(pair, true)}/trades`,
			qs: {
				// timestamp: start && typeof(start) === typeof(new Date()) ? start.getTime()/1000 : undefined
			},
			json: true,
			headers: headers,
			transform: body => {
				console.log(body);
				return body.map(trade => {
					return {
						tid: trade.trade_id,
						type: trade.type === 'buy' ? 'bid' : 'ask',
						amount: parseFloat(trade.size),
						pair: pair,
						price: parseFloat(trade.price),
						timestamp: new Date(trade.time)
					}
				});
			}
		}, cb);
	};

	prototype.orderbook = function (pair, level, cb) {
		let self = this;
		if (typeof(level) == 'function') {
			cb = level;
			level = undefined;
		}
		return parsers.request({
			uri: `${self.publicURI}/products/${normalize.pair(pair, true)}/book`,
			json: true,
			headers: headers,
			qs: {
				level: level || 2
			},
			transform: body => {
				let exchange = path.basename(__dirname);
				let market = new Market(pair, exchange);
				_.forIn(body, (book, side) => {
					if (side === 'asks' || side === 'bids') {
						_.each(book, (pp) => {
							market.book[side][pp[0]] = {
								price: parseFloat(pp[0]),
								amount: parseFloat(pp[1]),
								cnt: parseFloat(pp[2])
							};
						});
					}
				});
				return market;
			}
		}, cb);
	};

});



module.exports = exports = PublicClient;