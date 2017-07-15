const _ = require('lodash');
const parsers = require('../../util/parsers');
const Market = require('../../market');
const path = require('path');
const adapters = require('./adapters');

const PublicClient = function (publicURI) {
  const self = this;
  self.publicURI = publicURI || 'https://api.bitfinex.com/v1';
};


_.assign(PublicClient.prototype, new function () {
  const prototype = this;

  prototype.ticker = function (pair, cb) {
    const self = this;
    return parsers.request({
      uri: `${self.publicURI}/pubticker/${pair}/`,
      json: true,
      transform: body => ({
        last: parseFloat(body.last_price),
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

    return parsers.request({
      uri: `${self.publicURI}/symbols/`,
      json: true,
      transform: body => body.map(b => b.toUpperCase()),
    }, cb);
  };

  prototype.trades = function (pair, start, cb) {
    const self = this;
    if (typeof (start) === 'function') {
      cb = start;
      start = undefined;
    }
    return parsers.request({
      uri: `${self.publicURI}/trades/${pair}/`,
      qs: {
        timestamp: start && typeof (start) === typeof (new Date()) ? start.getTime() / 1000 : undefined,
      },
      json: true,
      transform: body => body.map(trade => ({
        tid: trade.tid,
        type: trade.type === 'buy' ? 'bid' : 'ask',
        amount: parseFloat(trade.amount),
        pair,
        price: parseFloat(trade.price),
        timestamp: new Date(parseFloat(trade.timestamp) * 1000),
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
      uri: `${self.publicURI}/book/${pair}/`,
      qs: {
        limit_bids: limitBids,
        limit_asks: limitAsks,
      },
      json: true,
      transform: (body) => {
        const exchange = path.basename(__dirname);
        const market = new Market(pair, exchange);
        _.forIn(body, (book, side) => {
          _.each(book, (pp) => {
            market.book.add(adapters.publicPriceLevel(pp, side));
          });
        });
        return market;
      },
    }, cb);
  };
}());


module.exports = exports = PublicClient;
