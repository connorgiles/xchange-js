const _  = require('lodash');
const parsers = require('../../util/parsers');
const normalize = require('./normalize');
const Market = require('../../market');
const path = require('path');

var PublicClient = function(publicURI) {
	let self = this;
	self.publicURI = publicURI || 'https://poloniex.com/public';
};


_.assign(PublicClient.prototype, new function() {
	let prototype = this;
	
	prototype.ticker = function (pair, cb) {
		let self = this;
		return parsers.request({
			uri: self.publicURI,
			qs: {
				command: 'returnTicker'
			},
			json: true,
			transform: body => {
				return {
					last: parseFloat(body[normalize.pair(pair, true)].last),
					high: parseFloat(body[normalize.pair(pair, true)].high24hr),
					low: parseFloat(body[normalize.pair(pair, true)].low24hr),
					bid: parseFloat(body[normalize.pair(pair, true)].highestBid),
					ask: parseFloat(body[normalize.pair(pair, true)].lowestAsk),
					volume: parseFloat(body[normalize.pair(pair, true)].quoteVolume),
					time: new Date()
				};
			}
		}, cb);
	};

	prototype.pairs = function (cb) {
		let self = this;

		return parsers.request({
			uri: self.publicURI,
			qs: {
				command: 'returnTicker'
			},
			json: true,
			transform: body => Object.keys(body).map(b => normalize.pair(b))
		}, cb);
	};

	prototype.trades = function (pair, start, end, cb) {
		let self = this;
		if (typeof(start) == 'function') {
			cb = start;
			start = undefined;
		}
		else if (typeof(end) == 'function') {
			cb = end;
			end = undefined;
		}
		return parsers.request({
			uri: self.publicURI,
			qs: {
				command: 'returnTradeHistory',
				currencyPair: normalize.pair(pair, true),
				start: start && typeof(start) === typeof(new Date()) ? start.getTime()/1000 : undefined,
				end: end && typeof(end) === typeof(new Date()) ? end.getTime()/1000 : undefined
			},
			json: true,
			transform: body => {
				return body.map(trade => {
					return {
						tid: trade.tradeID,
						type: trade.type === 'buy' ? 'bid' : 'ask',
						amount: parseFloat(trade.amount),
						pair: pair,
						price: parseFloat(trade.rate),
						timestamp: new Date(trade.date)
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
			uri: self.publicURI,
			qs: {
				command: 'returnOrderBook',
				currencyPair: normalize.pair(pair, true)
			},
			json: true,
			transform: body => {
				let exchange = path.basename(__dirname);
				let market = new Market(pair, exchange);
				
				_.forIn(body, (book, side) => {
					if (side === 'asks' || side === 'bids') {
						_.each(book, (pp) => {
							market.book[side][pp[0]] = {
								price: parseFloat(pp[0]),
								amount: parseFloat(pp[1])
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