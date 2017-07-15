const _ = require('lodash')

/**
 * Data Structure to hold an order
 * @param {int} id        id of order
 * @param {float} amount    size of order
 * @param {float} price     order limit price
 * @param {string} type      bid or ask
 * @param {int} timestamp epoch timestamp
 */
var Order = function(id, amount, price, type, time) {
	let self = this;
	if (!id || !amount || !amount || !price || !type) {
		throw new Error('Missing order paramaters');
	}
	self.id = id;
	self.amount = amount;
	self.price = price;
	self.type = type;
	self.time = time;
};

_.assign(Order.prototype, new function() {
	let prototype = this;

	prototype.value = function () {
		let self = this;
		return self.amount * self.price;
	}

});

module.exports = exports = Order;