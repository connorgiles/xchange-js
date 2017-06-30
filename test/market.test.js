const chai = require('chai');
const Market = require('../lib/market');

const should = chai.should();
const expect = chai.expect;

describe('market', function () {

	context('create market', function () {
		it('reflects passed pair', function (done) {
			let testPair = 'BTCUSD';
			let market = new Market(testPair);
			expect(market.pair).to.equal(testPair);
			done();
		});
		it('reflects passed ecxhange', function (done) {
			let testPair = 'BTCUSD';
			let testExhange = 'bitstamp'
			let market = new Market(testPair, testExhange);
			expect(market.exchange).to.equal(testExhange);
			done();
		});
	});

	context('access book of depth', function() {
		it('returns book of requested depth', function (done) {
			let market = new Market('BTCUSD', 'bitstamp');
			for (var i = 0; i < 5; i++) {
				market.book.asks[i] = {price: i, amount: i*5};
				let bidPrice = Math.round(100000/i)/100000;
				market.book.bids[bidPrice] = {price: bidPrice, amount: i*5};
			}
			let depth = 2;
			let shortBook = market.bookOfDepth(depth);
			expect(shortBook.asks.length).to.equal(depth);
			expect(shortBook.bids.length).to.equal(depth);
			done();
		});
		it('returns book of requested depth limited by orders', function (done) {
			let market = new Market('BTCUSD', 'bitstamp');
			for (var i = 0; i < 5; i++) {
				market.book.asks[i] = {price: i, amount: i*5};
			}
			let depth = 2;
			let shortBook = market.bookOfDepth(depth);
			expect(shortBook.asks.length).to.equal(depth);
			expect(shortBook.bids.length).to.equal(0);
			done();
		});
	});

	context('access top of book', function() {
		it('returns top bid and ask', function (done) {
			let market = new Market('BTCUSD', 'bitstamp');
			for (var i = 1; i < 6; i++) {
				market.book.asks[i] = {price: i, amount: i*5};
				let bidPrice = Math.round(100000/i)/100000;
				market.book.bids[bidPrice + ''] = {price: bidPrice, amount: i*5};
			}
			let topBook = market.topOfBook();
			expect(topBook).to.deep.equal({
				bid: {
					price: 1,
					amount: 5
				}, 
				ask: {
					price: 1,
					amount: 5
				}
			});
			done();
		});
		it('returns nulls when blank', function (done) {
			let market = new Market('BTCUSD', 'bitstamp');
			let topBook = market.topOfBook();
			expect(topBook).to.deep.equal({
				bid: null, ask: null
			});
			done();
		});
	});


});