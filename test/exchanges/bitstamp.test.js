const nock = require('nock');
const chai = require('chai');
const bitstamp = require('../../lib/exchanges/bitstamp');
const Market = require('../../lib/market');
const _ = require('lodash');

const should = chai.should();
const expect = chai.expect;

const client = new bitstamp.PublicClient();
const rootUrl = client.publicURI;

const testErrMsg = {msg: 'test-error'};

const testResponses = {
	ticker: {
		body: {
			"high": "1192.50",
			"last": "1181.40",
			"timestamp": "1492456833",
			"bid": "1178.55",
			"vwap": "1178.25",
			"volume": "3300.97957797",
			"low": "1161.00",
			"ask": "1181.39",
			"open": "1162.31"
		},
		response: {
			last: 1181.40,
			high: 1192.50,
			low: 1161.00,
			bid: 1178.55,
			ask: 1181.39,
			volume: 3300.97957797,
			time: new Date(1492456833*1000)
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
			"date":1444266681,
			"tid":11988919,
			"price":"244.8",
			"amount":"0.03297384",
			"type": 1
		}],
		response: [{ tid: 11988919,
			type: 'ask',
			amount: 0.03297384,
			pair: 'BTCUSD',
			price: 244.8,
			timestamp: new Date(1444266681000)
		}]
	},
	orderbook: {
		body: {
			"bids":[["574.61","0.1439327"]],
			"asks":[["574.62","19.1334"]]
		}
	}
};

nock(rootUrl)
.get('/ticker/btcusd/')
.twice()
.reply(200, testResponses.ticker.body);

nock(rootUrl)
.get('/ticker/btcusd/')
.twice()
.replyWithError(testErrMsg);

nock(rootUrl)
.get('/transactions/btcusd/')
.twice()
.reply(200, testResponses.trades.body);

nock(rootUrl)
.get('/transactions/btcusd/')
.query({time: 'minute'})
.twice()
.reply(200, testResponses.trades.body);

nock(rootUrl)
.get('/transactions/btcusd/')
.twice()
.replyWithError(testErrMsg);

nock(rootUrl)
.get('/order_book/btcusd/')
.twice()
.reply(200, testResponses.orderbook.body);

nock(rootUrl)
.get('/order_book/btcusd/')
.twice()
.replyWithError(testErrMsg);

describe('bitstamp', function () {

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
					expect(resp).to.deep.equal(client.supportedPairs);
					done();
				});
			});

			it('retrieves pairs using promise', function (done) {
				client.pairs().then((resp) => {
					expect(resp).to.deep.equal(client.supportedPairs);
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

		context('success call with interval param', function () {
			it('retrieves trade data using cb', function (done) {
				client.trades('BTCUSD', 'minute', function (err, resp) {
					expect(resp).to.deep.equal(testResponses.trades.response);
					done();
				});
			});

			it('retrieves trades using promise', function (done) {
				client.trades('BTCUSD', 'minute').then((resp) => {
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

		let market = new Market('BTCUSD', 'bitstamp');
		_.forIn(testResponses.orderbook.body, (book, side) => {
			if (side === 'asks' || side === 'bids') {
				_.each(book, (pp) => {
					market.book.add(bitstamp.adapters.publicPriceLevel(pp, side));
				});
			}
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