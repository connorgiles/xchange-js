const _ = require('lodash');
const parsers = require('../../util/parsers');
const Market = require('../../market');
const path = require('path');
const adapters = require('./adapters');

const headers = {
  'User-Agent': 'xchange-js',
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const PublicClient = function (publicURI='https://api.gdax.com') {
  const self = this;
  self.publicURI = publicURI;
};

_.assign(PublicClient.prototype, new function () {
  const prototype = this;

  prototype.ticker = function (pair, cb) {
    const self = this;
    pair = adapters.pair(pair, true);
    return parsers.request({
      uri: `${self.publicURI}/products/${pair}/ticker`,
      json: true,
      headers,
      transform: body => ({
        last: parseFloat(body.price),
        high: undefined,
        low: undefined,
        bid: parseFloat(body.bid),
        ask: parseFloat(body.ask),
        volume: parseFloat(body.volume),
        time: new Date(body.time),
      }),
    }, cb);
  };

  prototype.pairs = function (cb) {
    const self = this;

    return parsers.request({
      uri: `${self.publicURI}/products`,
      json: true,
      headers,
      transform: body => body.map(b => adapters.pair(b.id)),
    }, cb);
  };

  prototype.trades = function (pair, start, cb) {
    const self = this;
    if (typeof (start) === 'function') {
      cb = start;
      start = undefined;
    }
    return parsers.request({
      uri: `${self.publicURI}/products/${adapters.pair(pair, true)}/trades`,
      qs: {
        // timestamp: start && typeof(start) === typeof(new Date()) ? start.getTime()/1000 : undefined
      },
      json: true,
      headers,
      transform: (body) => {
        console.log(body);
        return body.map(trade => ({
          tid: trade.trade_id,
          type: trade.type === 'buy' ? 'bid' : 'ask',
          amount: parseFloat(trade.size),
          pair,
          price: parseFloat(trade.price),
          timestamp: new Date(trade.time),
        }));
      },
    }, cb);
  };

  prototype.orderbook = function (pair, level, market, cb) {
    const self = this;
    level = level || 2;
    if (typeof (level) === 'function') {
      cb = level;
      level = undefined;
    } else if (typeof (market) === 'function') {
      cb = market;
      market = undefined;
    }
    return parsers.request({
      uri: `${self.publicURI}/products/${adapters.pair(pair, true)}/book`,
      json: true,
      headers,
      qs: {
        level,
      },
      transform: (body) => {
        const exchange = path.basename(__dirname);
        market = market || new Market(pair, exchange);
        market.book.seq = body.sequence;
        _.forIn(body, (book, side) => {
          if (side === 'asks' || side === 'bids') {
            _.each(book, (pp) => {
              switch (level) {
                case 1:
                case 2:
                  market.book.add({
                    price: parseFloat(pp[0]),
                    amount: parseFloat(pp[1]),
                    id: parseFloat(pp[0]),
                    type: side === 'asks' ? 'ask' : 'bid',
                  });
                  break;

                case 3:
                  market.book.add({
                    price: parseFloat(pp[0]),
                    amount: parseFloat(pp[1]),
                    id: pp[2],
                    type: side === 'asks' ? 'ask' : 'bid',
                  });
                  break;
              }
            });
          }
        });
        return market;
      },
    }, cb);
  };
}());


module.exports = exports = PublicClient;
