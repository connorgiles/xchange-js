const _  = require('lodash');
const parsers = require('../../util/parsers');
const Market = require('../../market');
const path = require('path');

var PublicClient = function(publicURI) {
	let self = this;
	self.publicURI = publicURI || 'https://api.bitfinex.com/v1';
};


_.assign(PublicClient.prototype, new function() {
	let prototype = this;
	
	prototype.ticker = function (pair, cb) {
		let self = this;
		return parsers.request({
			uri: `${self.publicURI}/pubticker/${pair}/`,
			json: true,
			transform: body => {
				return {
					last: parseFloat(body.last_price),
					high: parseFloat(body.high),
					low: parseFloat(body.low),
					bid: parseFloat(body.bid),
					ask: parseFloat(body.ask),
					volume: parseFloat(body.volume),
					time: new Date(parseFloat(body.timestamp)*1000)
				};
			}
		}, cb);
	};

	prototype.pairs = function (cb) {
		let self = this;

		return parsers.request({
			uri: `${self.publicURI}/symbols/`,
			json: true,
			transform: body => body.map(b=>b.toUpperCase())
		}, cb);
	};

	prototype.trades = function (pair, start, cb) {
		let self = this;
		if (typeof(start) == 'function') {
			cb = start;
			start = undefined;
		}
		return parsers.request({
			uri: `${self.publicURI}/trades/${pair}/`,
			qs: {
				timestamp: start && typeof(start) === typeof(new Date()) ? start.getTime()/1000 : undefined
			},
			json: true,
			transform: body => {
				return body.map(trade => {
					return {
						tid: trade.tid,
						type: trade.type === 'buy' ? 'bid' : 'ask',
						amount: parseFloat(trade.amount),
						pair: pair,
						price: parseFloat(trade.price),
						timestamp: new Date(parseFloat(trade.timestamp)*1000)
					}
				});
			}
		}, cb);
	};

	prototype.orderbook = function (pair, limitBids, limitAsks, cb) {
		let self = this;
		if (typeof(limitBids) == 'function') {
			cb = limitBids;
			limitBids = undefined;
		}
		else if (typeof(limitAsks) == 'function') {
			cb = limitAsks;
			limitAsks = undefined;
		}
		return parsers.request({
			uri: `${self.publicURI}/book/${pair}/`,
			qs: {
				limit_bids: limitBids || 50,
				limit_asks: limitAsks || 50,
				group: 0
			},
			json: true,
			transform: body => {
				let exchange = path.basename(__dirname);
				let market = new Market(pair, exchange);
				_.forIn(body, (book, side) => {
					_.each(book, (pp) => {
						market.book[side][pp.price] = {
							price: parseFloat(pp.price),
							amount: parseFloat(pp.amount)
						};
					});
				});
				return market;
			}
		}, cb);
	};

});



module.exports = exports = PublicClient;