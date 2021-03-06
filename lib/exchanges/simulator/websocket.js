const EventEmitter = require('events').EventEmitter;
const util = require('util');
const path = require('path');
const _ = require('lodash');
const adapters = require('./adapters');
const Market = require('../../market');
const PublicClient = require('./public');
const mongoose = require('mongoose');
const Tick = require('./tick');

mongoose.Promise = require('bluebird');


const WebsocketClient = function (dbName = 'test', exchange = 'gdax', endpoint = 'mongodb://localhost/', pairs = []) {
  const self = this;

  self.dbName = dbName;
  self.endpoint = endpoint;
  self.exchange = exchange;

  self.markets = {};

  EventEmitter.call(self);

  self.supportedPairs = [];
  self.publicClient = new PublicClient();
  self.publicClient.pairs().then((pairs) => {
    self.supportedPairs = pairs;
    self.connect();
  });
};

util.inherits(WebsocketClient, EventEmitter);

_.assign(WebsocketClient.prototype, new function () {
  const prototype = this;

  prototype.connect = function () {
    const self = this;

    mongoose.connect(self.endpoint + self.dbName, {
      db: { native_parser: true },
      useMongoClient: true,
      server: {
        auto_reconnect: true,
        socketOptions: {
          keepAlive: 1,
          connectTimeoutMS: 300000,
          socketTimeoutMS: 300000,
        },
      },
    });
    self.db = mongoose.connection;
    self.db.once('open', self.onOpen.bind(self));
    self.db.on('error', self.onError.bind(self));
  };

  prototype.disconnect = function () {
    const self = this;
    self.db.close();
    self.emit('close');
  };

  prototype.start = function (start, end) {
    const self = this;
    const pairs = Object.keys(self.markets);
    const query = {
      exchange: self.exchange,
      symbol: { $in: pairs },
    };
    if (start || end) query.timestamp = {};
    if (start) query.timestamp.$gt = start;
    if (end) query.timestamp.$lt = end;

    Tick.count(query).then((count) => {
      const totalRecords = count;
      count = 0.0;

      const cursor = Tick.find(query).sort({ timestamp: 1 }).cursor();
      cursor.on('data', (t) => {
        count += 1.0;

        const p = self.markets[t.symbol];
        const asks = [];
        _.each(t.asks, (pp) => {
          asks.push(adapters.socketPriceLevel({
            price: pp.price,
            amount: pp.amount,
            type: 'ask',
          }));
        });
        const bids = [];
        _.each(t.bids, (pp) => {
          bids.push(adapters.socketPriceLevel({
            price: pp.price,
            amount: pp.amount,
            type: 'bid',
          }));
        });
        p.book.state({
          asks, bids,
        });

        self.emit('progress', count, totalRecords, t.timestamp);
        self.emit('change', p);
      });
      cursor.on('close', () => {
        self.disconnect();
      });
    }).catch(self.onError.bind(self));
  };

  prototype.subscribe = function (pair) {
    const self = this;

    // Pair is not supported
    if (_.indexOf(self.supportedPairs, pair) === -1) {
      console.error('Pair', pair, 'not supported');
      throw new Error('Pair not supported');
    }

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
    self.emit('open');
  };

  prototype.onClose = function () {
    const self = this;
    self.db = null;
    self.emit('close');
  };

  prototype.onMessage = function (pair, event, data) {
    const self = this;
    const p = self.markets[pair];
    if (!p) return;

    console.log(p);

    const pp = adapters.socketPriceLevel(data);

    if (event === 'order_created') p.book.add(pp);
    else if (event === 'order_changed') p.book.change(pp);
    else if (event === 'order_deleted') p.book.remove(pp.id);

    p.book.seq++;
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
