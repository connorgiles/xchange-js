const _ = require('lodash')

var Market = function(pair, exchange) {
	let self = this;
	self.pair = pair;
	self.exchange = exchange;
	self.channelId = null;
	self.book = {
		seq: 0,
		bids: {},
		asks: {}
	};
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
			bid: topBook.bids.length > 0 ? topBook.bids[0] : null,
			ask: topBook.asks.length > 0 ? topBook.asks[0] : null
		};
	}

});

module.exports = exports = Market;