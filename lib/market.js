const _ = require('lodash')
const Orderbook = require('./orderbook');

var Market = function(pair, exchange) {
	let self = this;
	self.pair = pair;
	self.exchange = exchange;
	self.channelId = undefined;
	self.book = new Orderbook();
}

_.assign(Market.prototype, new function() {
	let prototype = this;

	prototype.bookOfDepth = function(depth) {
		let self = this;
		let book = {};
		depth = depth || -1;
		_.each(['bids', 'asks'], function(side) {
			let prices = [];
			_.forIn(self.book[side], function(value, key) {
				prices.push(value);
			});
			book[side] = _.slice(prices.sort(function(a, b) {
				if (side === 'bids') {
					return +a.price >= +b.price ? -1 : 1;
				} else {
					return +a.price <= +b.price ? -1 : 1;
				}
			}), 0, depth);
		});
		return book;
	};

	prototype.topOfBook = function() {
		let self = this;
		let topBook = self.bookOfDepth(1);
		return {
			bid: topBook.bids.length > 0 ? topBook.bids[0] : undefined,
			ask: topBook.asks.length > 0 ? topBook.asks[0] : undefined
		};
	}

});

module.exports = exports = Market;