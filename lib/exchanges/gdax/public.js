const _  = require('lodash');
const parsers = require('../../util/parsers');
const Market = require('../../market');
const path = require('path');
const adapters = require('./adapters');

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
		pair = adapters.pair(pair, true);
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
			transform: body => body.map(b=>adapters.pair(b.id))
		}, cb);
	};

	prototype.trades = function (pair, start, cb) {
		let self = this;
		if (typeof(start) == 'function') {
			cb = start;
			start = undefined;
		}
		return parsers.request({
			uri: `${self.publicURI}/products/${adapters.pair(pair, true)}/trades`,
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

	prototype.orderbook = function (pair, level, market, cb) {
		let self = this;
		level = level || 2;
		if (typeof(level) == 'function') {
			cb = level;
			level = undefined;
		}
		else if (typeof(market) == 'function') {
			cb = market;
			market = undefined;
		}
		return parsers.request({
			uri: `${self.publicURI}/products/${adapters.pair(pair, true)}/book`,
			json: true,
			headers: headers,
			qs: {
				level: level
			},
			transform: body => {
				let exchange = path.basename(__dirname);
				market = market || new Market(pair, exchange);
				market.book.seq = body.sequence;
				_.forIn(body, (book, side) => {
					if (side === 'asks' || side === 'bids') {
						_.each(book, (pp) => {
							switch (level) {
								case 1:
								case 2:
								market.book.add({
									price: parseFloat(pp[0]),
									amount: parseFloat(pp[1]),
									id: parseFloat(pp[0]),
									type: side === 'asks' ? 'ask' : 'bid'
								});
								break;

								case 3:
								market.book.add({
									price: parseFloat(pp[0]),
									amount: parseFloat(pp[1]),
									id: pp[2], 
									type: side === 'asks' ? 'ask' : 'bid'
								});
								break;
							}
						});
					}
				});
				return market;
			}
		}, cb);
	};

});



module.exports = exports = PublicClient;