const _ = require('lodash');
const Orderbook = require('./orderbook');

const Market = function (pair, exchange) {
  const self = this;
  self.pair = pair;
  self.exchange = exchange;
  self.channelId = undefined;
  self.book = new Orderbook();
};

_.assign(Market.prototype, new function () {
  const prototype = this;
}());

module.exports = exports = Market;
