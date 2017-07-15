const EventEmitter = require('events').EventEmitter;
const Websocket = require('ws');
const util = require('util');
const path = require('path');
const _ = require('lodash');
const adapters = require('./adapters');
const Market = require('../../market');
const PublicClient = require('./public');

const WebsocketClient = function (websocketURI, options) {
  const self = this;

  self.websocketURI = websocketURI || 'wss://api2.poloniex.com';
  self.options = options || {};
  self.markets = {};

  EventEmitter.call(self);

  self.supportedPairs = [];
  self.publicClient = new PublicClient();
  self.publicClient.pairs().then((pairs) => {
    self.connect();
    self.supportedPairs = pairs;
  });
};

util.inherits(WebsocketClient, EventEmitter);

_.assign(WebsocketClient.prototype, new function () {
  const prototype = this;

  prototype.connect = function () {
    const self = this;

    if (self.socket) self.socket.close();

    self.socket = new Websocket(self.websocketURI);
    self.heartbeat = Date.now() + 4000;

    self.socket.on('message', self.onMessage.bind(self));
    self.socket.on('open', self.onOpen.bind(self));
    self.socket.on('close', self.onClose.bind(self));
    self.socket.on('error', self.onError.bind(self));
  };

  prototype.disconnect = function () {
    const self = this;

    if (!self.socket) throw new Error('Could not disconnect (not connected)');

    clearInterval(self._keepAliveInterval);
    self.socket.close();
  };

  prototype.subscribe = function (pair) {
    const self = this;

    // Pair is not supported
    if (_.indexOf(self.supportedPairs, pair) === -1) {
      console.error('Pair', pair, 'not supported');
      throw new Error('Pair not supported');
    }

    // If pair already exists return
    if (self.markets[pair]) return;

    self.socket.send(JSON.stringify({ command: 'subscribe', channel: adapters.pair(pair, true) }));
    const exchange = path.basename(__dirname);
    self.markets[pair] = new Market(pair, exchange);
    return self.markets[pair];
  };

  prototype.unsubscribe = function (pair) {
    const self = this;
    if (!self.markets[pair] || !self.markets[pair].channelId) return;
    self.socket.send(JSON.stringify({ command: 'unsubscribe', channel: adapters.pair(pair, true) }));
  };

  prototype.onOpen = function () {
    const self = this;
    self.heartbeat = Date.now();
    self._keepAliveInterval = setInterval(() => { self.socket.send('.'); }, 60000);
    self.emit('open');
  };

  prototype.onClose = function () {
    const self = this;
    self.socket = null;
    self.emit('close');
  };

  prototype.onMessage = function (data) {
    const self = this;

    self.heartbeat = Date.now();

    if (data.length === 0) return self.onError(new Error('Empty data'));

    data = JSON.parse(data);

    if ('error' in data) return self.onError(data);

    const cid = data[0];
    const sequence = data[1];
    let p;

    // Detect unsubscribe
    if (sequence === 0) {
      const pair = _.findKey(self.markets, m => m.channelId === cid);
      self.emit('unsubscribe', pair);
      delete self.markets[pair];
      return;
    }

    // heartbeat
    if (cid === 1010) return;
    else if (cid <= 0 || cid >= 1000) return self.onError('Wrong channel number', cid);

    _.each(data[2], (d) => {
      if (d[0] === 'i' && d[1] && d[1].currencyPair) {
        // Initialize Orderbook
        p = self.markets[adapters.pair(d[1].currencyPair)];
        p.channelId = cid;
        p.book.seq = sequence;

        if (!d[1].orderBook) return self.onError(new Error('Empty data'));

        _.forIn(d[1].orderBook[1], (amount, price) => {
          const pp = adapters.socketPriceLevel([price, amount, 'bid']);
          if (p.book.get(pp.id)) p.book.change(pp);
          else p.book.add(pp);
        });
        _.forIn(d[1].orderBook[0], (amount, price) => {
          const pp = adapters.socketPriceLevel([price, amount, 'ask']);
          if (p.book.get(pp.id)) p.book.change(pp);
          else p.book.add(pp);
        });
      } else if (d[0] === 'o') {
        // Adjust order
        p = _.find(self.markets, m => m.channelId === cid);
        // Check for errors
        if (!p) return;
        if (p.book.seq >= sequence) {
          const info = { orderSeq: sequence, marketSeq: p.book.seq };
          return self.onError('Wrong sequence number', info);
        }
        // Create the order and add it to the book

        d.push(d[1] === 0 ? 'ask' : 'bid');
        const pp = adapters.socketPriceLevel(_.slice(d, 2, 5));
        if (pp.amount === 0) p.book.remove(pp.id);
        else p.book.change(pp);
      }
    });

    self.emit('change', p);
    self.emit('message', data);
  };

  prototype.onError = function (err) {
    const self = this;
    if (!err) return;
    self.emit('error', err);
  };
}());

module.exports = exports = WebsocketClient;
