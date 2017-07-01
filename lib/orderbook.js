const _ = require('lodash');
const Order = require('./order');
const RBTree = require('bintrees').RBTree;

var Orderbook = function() {
	let self = this;
	self.seq = 0;
	self.reset();
};

_.assign(Orderbook.prototype, new function() {
	let prototype = this;

	prototype._getSide = function(side) {
		return side === 'ask' ? this._asks : this._bids;
	};

	prototype.get = function(orderId) {
		return this._orders[orderId];
	};

	prototype.reset = function() {
		this._orders = {};
		this._bids = new RBTree((a,b) => a.price - b.price);
		this._asks = new RBTree((a,b) => a.price - b.price);
	};

	prototype.state = function(book) {
		let self = this;

		if (book) {
			self.reset();
			_.each(book.bids, (o) => self.add);
			_.each(book.asks, (o) => self.add);
		}
		else {

			book = {
				bids: [],
				asks: []
			}

			self._asks.each(ask => {
				_.each(ask.orders, o => book.asks.push(o));
			});

			self._bids.reach(bid => {
				_.each(bid.orders, o => book.bids.push(o));
			});

			return book;

		}
	};

	prototype._aggregateNode = function(node) {
		if (!node) return;
		let pp = {
			amount: 0, 
			price: node.price,
			count: 0
		}
		_.each(node.orders, o => {
			pp.amount += o.amount;
			pp.count++;
		});
		return pp;
	};

	prototype.depth = function(deep) {
		let self = this;

		if (!deep) deep = -1;

		book = {
			bids: [],
			asks: []
		}
		let node;
		let askDepth = deep;
		let bidDepth = deep;

		let it = self._asks.iterator();
		while((node = it.next()) !== null && askDepth !== 0) {
			book.asks.push(self._aggregateNode(node));
			askDepth--;
		}

		it = self._bids.iterator();
		while((node = it.prev()) !== null && bidDepth !== 0) {
			book.bids.push(self._aggregateNode(node));
			bidDepth--;
		}

		return book;
	};

	prototype.top = function() {
		let self = this;

		book = {
			bid: self._aggregateNode(self._bids.max()),
			ask: self._aggregateNode(self._asks.min())
		}

		return book;
	}

	prototype.add = function(order) {
		let self = this;

		order = new Order(order.id, order.amount, order.price, order.type, order.time);

		let tree = self._getSide(order.type);
		let node = tree.find({price: order.price});

		if (!node) {
			node = {
				price: order.price,
				orders: []
			};
			tree.insert(node);
		}

		node.orders.push(order);
		self._orders[order.id] = order;
	};

	prototype.remove = function(orderId) {
		let self = this;
		let order = self.get(orderId);

		if (!order) return;

		let tree = self._getSide(order.type);
		let node = tree.find({price: order.price});
		assert(node);
		let orders = node.orders;

		orders.splice(orders.indexOf(order), 1);

		if (orders.length === 0) {
			tree.remove(node);
		}

		delete self._orders[order.id];
	};

	prototype.change = function(delta) {
		let self = this;
		let order = self.get(delta.id);

		if (!order) return;

		let tree = self._getSide(order.type);
		let node = tree.find({price: order.price});

		if (!node || node.orders.indexOf(order) < 0) return;

		order.amount = delta.amount;
		order.price = delta.price;
	};

});

module.exports = exports = Orderbook;