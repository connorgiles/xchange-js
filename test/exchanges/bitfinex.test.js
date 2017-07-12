const nock = require('nock');
const chai = require('chai');
const bitfinex = require('../../lib/exchanges/bitfinex');
const Market = require('../../lib/market');
const _ = require('lodash');

const should = chai.should();
const expect = chai.expect

const client = new bitfinex.PublicClient();
const rootUrl = client.publicURI;

const testErrMsg = {msg: 'test-error'};

const testResponses = {
	ticker: {
		body: {
			"mid": "244.755",
			"bid": "244.75",
			"ask": "244.76",
			"last_price": "244.82",
			"low": "244.2",
			"high": "248.19",
			"volume": "7842.11542563",
			"timestamp": "1444253422.348340958"
		},
		response: {
			last: 244.82,
			high: 248.19,
			low: 244.2,
			bid: 244.75,
			ask: 244.76,
			volume: 7842.11542563,
			time: new Date(1444253422.348340958*1000)
		}
		
	},
	symbols: {
		body: [
		"btcusd",
		"ltcusd",
		"ltcbtc"
		],
		response: [
		"BTCUSD",
		"LTCUSD",
		"LTCBTC"
		]
	},
	trades: {
		body: [{
			"timestamp":1444266681,
			"tid":11988919,
			"price":"244.8",
			"amount":"0.03297384",
			"exchange":"bitfinex",
			"type":"sell"
		}],
		response: [{ tid: 11988919,
			type: 'ask',
			amount: 0.03297384,
			pair: 'BTCUSD',
			price: 244.8,
			timestamp: new Date(1444266681*1000)
		}]
	},
	orderbook: {
		body: {
			"bids":[{
				"price":"574.61",
				"amount":"0.1439327",
				"timestamp":"1472506127.0"
			}],
			"asks":[{
				"price":"574.62",
				"amount":"19.1334",
				"timestamp":"1472506126.0"
			}]
		}
	}
};

nock(rootUrl)
.get('/pubticker/BTCUSD/')
.twice()
.reply(200, testResponses.ticker.body);

nock(rootUrl)
.get('/pubticker/BTCUSD/')
.twice()
.replyWithError(testErrMsg);

nock(rootUrl)
.get('/symbols/')
.twice()
.reply(200, testResponses.symbols.body);

nock(rootUrl)
.get('/symbols/')
.twice()
.replyWithError(testErrMsg);

nock(rootUrl)
.get('/trades/BTCUSD/')
.times(2)
.reply(200, testResponses.trades.body);

nock(rootUrl)
.get('/trades/BTCUSD/')
.query({timestamp: 1498930804.451})
.times(2)
.reply(200, testResponses.trades.body);

nock(rootUrl)
.get('/trades/BTCUSD/')
.twice()
.replyWithError(testErrMsg);

nock(rootUrl)
.get('/book/BTCUSD/')
.twice()
.reply(200, testResponses.orderbook.body);

nock(rootUrl)
.get('/book/BTCUSD/')
.twice()
.replyWithError(testErrMsg);

describe('bitfinex', function () {

	describe('ticker', function () {

		context('success call', function () {
			it('retrieves ticker data using cb', function (done) {
				client.ticker('BTCUSD', function (err, resp) {
					expect(resp).to.deep.equal(testResponses.ticker.response);
					done();
				});
			});

			it('retrieves ticker using promise', function (done) {
				client.ticker('BTCUSD').then((resp) => {
					expect(resp).to.deep.equal(testResponses.ticker.response);
					done();
				});
			});
		});

		context('error call', function () {
			it('retrieves error using cb', function (done) {
				client.ticker('BTCUSD', function (err, resp) {
					expect(err).to.deep.equal(testErrMsg);
					done();
				});
			});

			it('retrieves error promise', function (done) {
				client.ticker('BTCUSD').then().catch((err) => {
					expect(err).to.deep.equal(testErrMsg);
					done();
				});
			});
		});

	});

	describe('pairs', function () {

		context('success call', function () {
			it('retrieves pairs data using cb', function (done) {
				client.pairs(function (err, resp) {
					expect(resp).to.deep.equal(testResponses.symbols.response);
					done();
				});
			});

			it('retrieves pairs using promise', function (done) {
				client.pairs().then((resp) => {
					expect(resp).to.deep.equal(testResponses.symbols.response);
					done();
				});
			});
		});

		context('error call', function () {
			it('retrieves error using cb', function (done) {
				client.pairs(function (err, resp) {
					expect(err).to.deep.equal(testErrMsg);
					done();
				});
			});

			it('retrieves error promise', function (done) {
				client.pairs().then().catch((err) => {
					expect(err).to.deep.equal(testErrMsg);
					done();
				});
			});
		});

	});

	describe('trades', function () {

		context('success call', function () {
			it('retrieves trade data using cb', function (done) {
				client.trades('BTCUSD', function (err, resp) {
					expect(resp).to.deep.equal(testResponses.trades.response);
					done();
				});
			});

			it('retrieves trades using promise', function (done) {
				client.trades('BTCUSD').then((resp) => {
					expect(resp).to.deep.equal(testResponses.trades.response);
					done();
				});
			});
		});

		context('success call with start param', function () {
			it('retrieves trade data using cb', function (done) {
				client.trades('BTCUSD', new Date(1498930804451), function (err, resp) {
					expect(resp).to.deep.equal(testResponses.trades.response);
					done();
				});
			});

			it('retrieves trades using promise', function (done) {
				client.trades('BTCUSD', new Date(1498930804451)).then((resp) => {
					expect(resp).to.deep.equal(testResponses.trades.response);
					done();
				});
			});
		});

		context('error call', function () {
			it('retrieves error using cb', function (done) {
				client.trades('BTCUSD', function (err, resp) {
					expect(err).to.deep.equal(testErrMsg);
					done();
				});
			});

			it('retrieves error promise', function (done) {
				client.trades('BTCUSD').then().catch((err) => {
					expect(err).to.deep.equal(testErrMsg);
					done();
				});
			});
		});

	});

	describe('orderbook', function () {

		let market = new Market('BTCUSD', 'bitfinex');
		_.forIn(testResponses.orderbook.body, (book, side) => {
			_.each(book, (pp) => {
				market.book.add(bitfinex.adapters.publicPriceLevel(pp, side));
			});
		});

		context('success call', function () {
			it('retrieves orderbook using cb', function (done) {
				client.orderbook('BTCUSD', function (err, resp) {
					expect(resp.book.depth()).to.deep.equal(market.book.depth());
					done();
				});
			});

			it('retrieves orderbook using promise', function (done) {
				client.orderbook('BTCUSD').then((resp) => {
					expect(resp.book.depth()).to.deep.equal(market.book.depth());
					done();
				});
			});
		});

		context('error call', function () {
			it('retrieves error using cb', function (done) {
				client.orderbook('BTCUSD', function (err, resp) {
					expect(err).to.deep.equal(testErrMsg);
					done();
				});
			});

			it('retrieves error promise', function (done) {
				client.orderbook('BTCUSD').then().catch((err) => {
					expect(err).to.deep.equal(testErrMsg);
					done();
				});
			});
		});

	});

});