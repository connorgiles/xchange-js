const EventEmitter = require('events').EventEmitter;
const Websocket = require('ws');
const util = require('util');
const path = require('path');
const _ = require('lodash');
const adapters = require('./adapters');
const Market = require('../../market');
const PublicClient = require('./public');


const WebsocketClient = function (websocketURI, auth) {
  const self = this;

  self.websocketURI = websocketURI || 'wss://ws-feed.gdax.com';
  self.markets = {};

  self._queues = {};

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

    if (self.socket) {
      self.socket.close();
    }

    self.socket = new Websocket(self.websocketURI);

    self.socket.on('message', self.onMessage.bind(self));
    self.socket.on('open', self.onOpen.bind(self));
    self.socket.on('close', self.onClose.bind(self));
    self.socket.on('error', self.onError.bind(self));
  };

  prototype.disconnect = function () {
    const self = this;

    if (!self.socket) {
      throw 'Could not disconnect (not connected)';
    }

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

    self.socket.send(JSON.stringify({
      type: 'subscribe',
      product_ids: [adapters.pair(pair, true)],
    }));

    // Set a 30 second ping to keep connection alive
    self.pinger = setInterval(() => {
      self.socket.ping('keepalive');
    }, 30000);


    const exchange = path.basename(__dirname);
    self.markets[pair] = new Market(pair, exchange);

    // Start loading book
    self.loadOrderbook.bind(self)(pair);

    return self.markets[pair];
  };

  prototype.loadOrderbook = function (pair) {
    const self = this;

    self.markets[pair].book.loading = true;
    self._queues[pair] = [];

    console.log('Loading orderbook');

    self.publicClient.orderbook(pair, 3, self.markets[pair]).then((m) => {
      while (self._queues[pair].length > 0) {
        self.onMessage.bind(self)(self._queues[pair].shift(), true);
      }
      self.markets[pair].book.loading = false;
      console.log('Orderbook loaded');
    }).catch((err) => {
      self.onError.bind(self)(err);
      console.error('Error loading - trying again');
      self.loadOrderbook.bind(self)(pair);
    });
  };

  prototype.unsubscribe = function (pair) {
    const self = this;
    if (!self.markets[pair] || !self.markets[pair].channelId) return;
    delete self.markets[pair];
  };

  prototype.onOpen = function () {
    const self = this;

    // Subscribe if user passed valid auth values
    if (self.auth) {
      self.socket.send(JSON.stringify(self.auth));
    }

    self.emit('open');
  };

  prototype.onClose = function () {
    const self = this;
    clearInterval(self.pinger);
    self.socket = null;
    self.emit('close');
  };

  prototype.onMessage = function (data, filling) {
    const self = this;

    data = JSON.parse(data);
    const pair = adapters.pair(data.product_id);
    const p = self.markets[pair];
    if (!p) return;

    if (p.book.loading && !filling) {
      self._queues[pair].push(JSON.stringify(data));
      return;
    }

    if (p.book.seq >= data.sequence) {
      // Already been processed
      return;
    }

    if (data.sequence != p.book.seq + 1) {
      // Out of sequence - reload book
      self.loadOrderbook(pair);
      return;
    }

    p.book.seq = data.sequence;

    switch (data.type) {
      case 'open':
        data.size = data.remaining_size;
        p.book.add(adapters.socketPriceLevel(data));
        break;

      case 'done':
        p.book.remove(data.order_id);
        break;

      case 'match':
        data.order_id = data.maker_order_id;
        data.amount = data.size;
        p.book.match(adapters.socketPriceLevel(data));
        break;

      case 'change':
        data.size = data.new_size;
        p.book.change(adapters.socketPriceLevel(data));
        break;
    }

    self.emit('change', p);
    self.emit('message', data);
  };

  prototype.onError = function (err) {
    const self = this;

    if (!err) {
      return;
    }

    if (err.message === 'unexpected server response (429)') {
      err = new Error('You are connecting too fast and are being throttled! Make sure you subscribe to multiple books on one connection.');
      throw err;
    }

    self.emit('error', err);
  };
}());

module.exports = exports = WebsocketClient;
