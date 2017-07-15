const chai = require('chai');
const Order = require('../lib/order');

const should = chai.should();
const expect = chai.expect;

describe('order', function () {

	context('success create order', function () {

		let id = '1234';
		let amount = 1.23;
		let price = 2000;
		let type = 'ask';
		let time = new Date();

		let order = new Order(id, amount, price, type, time);

		it('reflects passed id', function (done) {
			expect(order.id).to.equal(id);
			done();
		});
		it('reflects passed amount', function (done) {
			expect(order.amount).to.equal(amount);
			done();
		});
		it('reflects passed price', function (done) {
			expect(order.price).to.equal(price);
			done();
		});
		it('reflects passed type', function (done) {
			expect(order.type).to.equal(type);
			done();
		});
		it('reflects passed time', function (done) {
			expect(order.time).to.equal(time);
			done();
		});
		it('reflects calculated value', function (done) {
			expect(order.value()).to.equal(price*amount);
			done();
		});
	});

	context('error create order', function () {

		let id = '1234';
		let amount = 1.23;
		let price = 2000;
		let type = 'ask';
		let time = new Date();

		it('throws error for id', function (done) {
			expect(() => { new Order() }).to.throw();
			done();
		});
		it('throws error for amount', function (done) {
			expect(() => { new Order(id) }).to.throw();
			done();
		});
		it('throws error for price', function (done) {
			expect(() => { new Order(id, amount) }).to.throw();
			done();
		});
		it('throws error for type', function (done) {
			expect(() => { new Order(id, amount, price) }).to.throw();
			done();
		});

	});


});