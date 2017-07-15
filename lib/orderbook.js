const EventEmitter = require('events').EventEmitter;
const _ = require('lodash');
const Order = require('./order');
const RBTree = require('bintrees').RBTree;
const assert = require('assert');
const util = require('util');
const hash = require('object-hash');

const now = require('performance-now');

const Orderbook = function () {
  const self = this;
  self.seq = 0;
  self.loading = false;
  self.reset();
};

util.inherits(Orderbook, EventEmitter);

_.assign(Orderbook.prototype, new function () {
  const prototype = this;

  prototype._getSide = function (side) {
    return side === 'ask' ? this._asks : this._bids;
  };

  prototype.get = function (orderId) {
    return this._orders[orderId] || null;
  };

  prototype.reset = function () {
    this._orders = {};
    this._bids = new RBTree((a, b) => a.price - b.price);
    this._asks = new RBTree((a, b) => a.price - b.price);
    this._versionHashes = {};
  };

  prototype._checkSubscriptions = function () {
    const self = this;
    _.defer(() => {
      _.forIn(self._versionHashes, (pastHash, depth) => {
        const book = self.depth(depth);
        const newHash = hash(book);
        if (pastHash !== newHash) {
          self.emit('change', depth, book);
          self._versionHashes[depth] = newHash;
        }
      });
    });
  };

  prototype.subscribe = function (depth) {
    this._versionHashes[depth] = hash(this.depth(depth));
  };

  prototype.unsubscribe = function (depth) {
    if (this._versionHashes[depth]) delete this._versionHashes[depth];
  };

  prototype.state = function (book) {
    const self = this;

    if (book) {
      if (!book.asks || !book.bids) {
        throw new Error('Missing book paramaters');
      }

      self.reset();
      _.each(book.asks, (o) => {
        self.add(o);
      });
      _.each(book.bids, (o) => {
        self.add(o);
      });

      self._checkSubscriptions();
    } else {
      book = {
        bids: [],
        asks: [],
      };

      self._asks.each((ask) => {
        _.each(ask.orders, o => book.asks.push(o));
      });

      self._bids.reach((bid) => {
        _.each(bid.orders, o => book.bids.push(o));
      });

      return book;
    }
  };

  prototype._aggregateNode = function (node) {
    if (!node) return;
    const pp = {
      amount: 0,
      price: node.price,
      count: 0,
    };
    _.each(node.orders, (o) => {
      pp.amount += o.amount;
      pp.count++;
    });
    return pp;
  };

  prototype.depth = function (deep) {
    const self = this;

    if (!deep) deep = -1;

    book = {
      bids: [],
      asks: [],
    };
    let node;
    let askDepth = deep;
    let bidDepth = deep;

    let it = self._asks.iterator();
    while ((node = it.next()) !== null && askDepth !== 0) {
      book.asks.push(self._aggregateNode(node));
      askDepth--;
    }

    it = self._bids.iterator();
    while ((node = it.prev()) !== null && bidDepth !== 0) {
      book.bids.push(self._aggregateNode(node));
      bidDepth--;
    }

    return book;
  };

  prototype.top = function () {
    const self = this;

    book = {
      bid: self._aggregateNode(self._bids.max()),
      ask: self._aggregateNode(self._asks.min()),
    };

    return book;
  };

  prototype.add = function (order) {
    const self = this;

    order = new Order(order.id, order.amount, order.price, order.type, order.time);

    const tree = self._getSide(order.type);
    let node = tree.find({ price: order.price });

    if (!node) {
      node = {
        price: order.price,
        orders: [],
      };
      tree.insert(node);
    }

    node.orders.push(order);
    self._orders[order.id] = order;

    self._checkSubscriptions();
  };

  prototype.remove = function (orderId) {
    const self = this;
    const order = self.get(orderId);

    if (!order) return;

    const tree = self._getSide(order.type);
    const node = tree.find({ price: order.price });

    try {
      assert(node);
      const orders = node.orders;
      orders.splice(orders.indexOf(order), 1);
      if (orders.length === 0) {
        tree.remove(node);
      }

      delete self._orders[order.id];
    } catch (err) {
      self._checkSubscriptions();
    }
  };

  prototype.match = function (match) {
    const self = this;

    const size = match.amount;
    const price = match.price;
    const tree = self._getSide(match.type);
    const node = tree.find({ price });
    assert(node);

    const order = node.orders.find(o => o.id == match.id);

    assert(order);

    order.amount -= match.amount;
    try {
      assert(order.amount >= 0);
    } catch (err) {
      console.log(order);
    }
    if (order.amount === 0) {
      self.remove(order.id);
    }
  };

  prototype.change = function (delta) {
    const self = this;
    const order = self.get(delta.id);

    if (!order) return;

    const tree = self._getSide(order.type);
    const node = tree.find({ price: order.price });

    if (!node || node.orders.indexOf(order) < 0) return;

    order.amount = delta.amount;
    order.price = delta.price;

    self._checkSubscriptions();
  };
}());

module.exports = exports = Orderbook;
