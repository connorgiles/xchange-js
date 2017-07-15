const _ = require('lodash');
const parsers = require('../../util/parsers');
const Market = require('../../market');
const path = require('path');
const adapters = require('./adapters');

const PublicClient = function (publicURI) {
  const self = this;
  self.publicURI = publicURI || 'https://www.bitstamp.net/api/v2';
  self.supportedPairs = ['BTCUSD', 'BTCEUR', 'EURUSD',
    'XRPUSD', 'XRPEUR', 'XRPBTC',
    'LTCUSD', 'LTCEUR', 'LTCBTC'];
};


_.assign(PublicClient.prototype, new function () {
  const prototype = this;

  prototype.ticker = function (pair, cb) {
    const self = this;

    return parsers.request({
      uri: `${self.publicURI}/ticker/${pair.toLowerCase()}/`,
      json: true,
      transform: body => ({
        last: parseFloat(body.last),
        high: parseFloat(body.high),
        low: parseFloat(body.low),
        bid: parseFloat(body.bid),
        ask: parseFloat(body.ask),
        volume: parseFloat(body.volume),
        time: new Date(parseFloat(body.timestamp) * 1000),
      }),
    }, cb);
  };

  prototype.pairs = function (cb) {
    const self = this;
    if (!cb) {
      return new Promise((resolve, reject) => resolve(self.supportedPairs));
    }
    return cb(null, self.supportedPairs);
  };

  prototype.trades = function (pair, interval, cb) {
    const self = this;
    if (typeof (interval) === 'function') {
      cb = interval;
      interval = undefined;
    }
    return parsers.request({
      uri: `${self.publicURI}/transactions/${pair.toLowerCase()}/`,
      qs: {
        time: interval,
      },
      json: true,
      transform: body => body.map(trade => ({
        tid: trade.tid,
        type: trade.type === '0' ? 'bid' : 'ask',
        amount: parseFloat(trade.amount),
        pair,
        price: parseFloat(trade.price),
        timestamp: new Date(parseFloat(trade.date) * 1000),
      })),
    }, cb);
  };

  prototype.orderbook = function (pair, limitBids, limitAsks, cb) {
    const self = this;
    if (typeof (limitBids) === 'function') {
      cb = limitBids;
      limitBids = undefined;
    } else if (typeof (limitAsks) === 'function') {
      cb = limitAsks;
      limitAsks = undefined;
    }
    return parsers.request({
      uri: `${self.publicURI}/order_book/${pair.toLowerCase()}/`,
      json: true,
      transform: (body) => {
        const exchange = path.basename(__dirname);
        const market = new Market(pair, exchange);
        _.forIn(body, (book, side) => {
          if (side === 'asks' || side === 'bids') {
            _.each(book, (pp) => {
              market.book.add(adapters.publicPriceLevel(pp, side));
            });
          }
        });
        return market;
      },
    }, cb);
  };
}());


module.exports = exports = PublicClient;
