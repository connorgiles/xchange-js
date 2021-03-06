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

  self.websocketURI = websocketURI || 'wss://api.bitfinex.com/ws';
  self.markets = {};

  if (auth && !(auth.secret && auth.key)) {
    throw new Error('Invalid or incomplete authentication credentials. You should either provide all of the secret, key and passphrase fields, or leave auth null');
  } else if (auth) {
    const authNonce = Date.now() * 1000;
    const authPayload = `AUTH${authNonce}`;
    const authSig = crypto
      .HmacSHA384(authPayload, auth.secret)
      .toString(crypto.enc.Hex);
    self.auth = {
      apiKey: auth.key,
      authSig,
      authNonce,
      authPayload,
      event: 'auth',
    };
  }

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

    self.socket.send(JSON.stringify({ event: 'subscribe', channel: 'book', pair, prec: 'R0', len: '100' }));
    const exchange = path.basename(__dirname);
    self.markets[pair] = new Market(pair, exchange);
    return self.markets[pair];
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
    self.socket = null;
    self.emit('close');
  };

  prototype.onMessage = function (data) {
    const self = this;
    data = JSON.parse(data);

    if (data.event) {
      if (data.channel === 'book' && data.event === 'subscribed' && data.pair && self.markets[data.pair]) {
        self.markets[data.pair].channelId = data.chanId;
        self.emit('susubscribed', data.pair);
      }
      return;
    } else if (data[1] === 'hb') return;

    const p = _.find(self.markets, m => m.channelId === data[0]);

    if (!p) return;

    if (p.book.seq === 0) {
      _.each(data[1], (pp) => {
        p.book.add(adapters.socketPriceLevel(pp));
      });
    } else {
      const pp = adapters.socketPriceLevel(data.slice(1));
      if (pp.price === 0) p.book.remove(pp.id);
      else {
        const order = p.book.get(pp.id);
        if (!order) p.book.add(pp);
        else p.book.change(pp);
      }
    }

    p.book.seq++;
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
