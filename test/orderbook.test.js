const chai = require('chai');
const Orderbook = require('../lib/orderbook');
const Order = require('../lib/order');
const RBTree = require('bintrees').RBTree;
const _ = require('lodash');

const should = chai.should();
const expect = chai.expect;

describe('orderbook', function () {

	let book = new Orderbook(); 

	context('create orderbook', function () {
		it('creates empty orderbook', function (done) {
			expect(book._orders).to.deep.equal({});

			expect(book._asks).to.be.an.instanceof(RBTree);
			expect(book._bids).to.be.an.instanceof(RBTree);

			expect(book._bids.size).to.equal(0);
			expect(book._bids.size).to.equal(0);

			done();
		});
	});

	context('success change state', function () {
		let state = {
			bids: [
			new Order('1234', 1.23, 2000, 'bid', new Date())
			],
			asks: [
			new Order('1235', 1.23, 2001, 'ask', new Date())
			]
		};
		it('reflects new state', function (done) {
			let clone = _.cloneDeep(book);
			clone.state(state);
			expect(clone.state()).to.deep.equal(_.cloneDeep(state));
			done();
		});
	});

	context('error change state', function () {
		it('trows error for bids', function (done) {
			let clone = _.cloneDeep(book);
			expect(() => { clone.state({asks: [] }) }).to.throw();
			done();
		});
		it('trows error for asks', function (done) {
			let clone = _.cloneDeep(book);
			expect(() => { clone.state({ bids: [] }) }).to.throw();
			done();
		});
	});

	context('get order', function () {
		it('that exists', function (done) {
			let clone = _.cloneDeep(book);
			let newOrder = new Order('1234', 1.23, 2000, 'bid', new Date());
			clone.add(newOrder);
			expect(clone.get(newOrder.id)).to.deep.equal(_.cloneDeep(newOrder));
			done();
		});
		it('null for order that doesn\'t exist', function (done) {
			expect(book.get('test')).to.be.null;
			done();
		});
	});

	context('change order', function () {
		it('that exists', function (done) {
			let clone = _.cloneDeep(book);

			let newOrder = new Order('1234', 1.23, 2000, 'bid', new Date());
			clone.add(_.cloneDeep(newOrder));
			newOrder.amount = 2;
			clone.change(newOrder);

			expect(clone.get(newOrder.id)).to.deep.equal(newOrder);
			done();
		});
		it('no change for order that doesn\'t exist', function (done) {
			let clone = _.cloneDeep(book);
			let newOrder = new Order('1234', 1.23, 2000, 'bid', new Date());
			clone.change(newOrder);
			expect(clone.get(newOrder.id)).to.be.null;
			done();
		});
	});


});
