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

});

module.exports = exports = Market;