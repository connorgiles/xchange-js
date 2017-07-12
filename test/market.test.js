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


});