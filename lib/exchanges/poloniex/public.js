const _ = require('lodash');
const parsers = require('../../util/parsers');
const adapters = require('./adapters');
const Market = require('../../market');
const path = require('path');

const PublicClient = function (publicURI) {
  const self = this;
  self.publicURI = publicURI || 'https://poloniex.com/public';
};


_.assign(PublicClient.prototype, new function () {
  const prototype = this;

  prototype.ticker = function (pair, cb) {
    const self = this;
    return parsers.request({
      uri: self.publicURI,
      qs: {
        command: 'returnTicker',
      },
      json: true,
      transform: (body) => {
        pair = adapters.pair(pair, true);
        return {
          last: parseFloat(body[pair].last),
          high: parseFloat(body[pair].high24hr),
          low: parseFloat(body[pair].low24hr),
          bid: parseFloat(body[pair].highestBid),
          ask: parseFloat(body[pair].lowestAsk),
          volume: parseFloat(body[pair].quoteVolume),
          time: new Date(),
        };
      },
    }, cb);
  };

  prototype.pairs = function (cb) {
    const self = this;

    return parsers.request({
      uri: self.publicURI,
      qs: {
        command: 'returnTicker',
      },
      json: true,
      transform: body => Object.keys(body).map(b => adapters.pair(b)),
    }, cb);
  };

  prototype.trades = function (pair, start, end, cb) {
    const self = this;
    if (typeof (start) === 'function') {
      cb = start;
      start = undefined;
    } else if (typeof (end) === 'function') {
      cb = end;
      end = undefined;
    }
    return parsers.request({
      uri: self.publicURI,
      qs: {
        command: 'returnTradeHistory',
        currencyPair: adapters.pair(pair, true),
        start: start && typeof (start) === typeof (new Date()) ? start.getTime() / 1000 : undefined,
        end: end && typeof (end) === typeof (new Date()) ? end.getTime() / 1000 : undefined,
      },
      json: true,
      transform: body => body.map(trade => ({
        tid: trade.tradeID,
        type: trade.type === 'buy' ? 'bid' : 'ask',
        amount: parseFloat(trade.amount),
        pair,
        price: parseFloat(trade.rate),
        timestamp: new Date(trade.date),
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
      uri: self.publicURI,
      qs: {
        command: 'returnOrderBook',
        currencyPair: adapters.pair(pair, true),
      },
      json: true,
      transform: (body) => {
        const exchange = path.basename(__dirname);
        const market = new Market(pair, exchange);

        _.forIn(body, (book, side) => {
          if (side === 'asks' || side === 'bids') {
            _.each(book, (pp) => {
              market.book.add(market.book.add(adapters.publicPriceLevel(pp, side)));
            });
          }
        });
        return market;
      },

    }, cb);
  };
}());


module.exports = exports = PublicClient;
