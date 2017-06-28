const _ = require('lodash')

var Market = function(pair) {
	let self = this;
	self.pair = pair;
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
});

module.exports = exports = Market;