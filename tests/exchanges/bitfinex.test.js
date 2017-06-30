const nock = require('nock');
const chai = require('chai');
const bitfinex = require('../../lib/exchanges/bitfinex');

const should = chai.should();
const expect = chai.expect

const client = new bitfinex.PublicClient();
const rootUrl = client.publicURI;

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
			high: null,
			low: null,
			bid: 244.75,
			ask: 244.76,
			volume: null,
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
	}
};

nock(rootUrl)
.get('/ticker/BTCUSD/')
.twice()
.reply(200, testResponses.ticker.body);

nock(rootUrl)
.get('/symbols/')
.twice()
.reply(200, testResponses.symbols.body);

describe('bitfinex', function () {

	describe('ticker', function () {

		context('success call', function () {
			it('retrieves ticker data using cb', function (done) {
				client.getTicker('BTCUSD', function (err, resp) {
					expect(resp).to.deep.equal(testResponses.ticker.response);
					done();
				});
			});

			it('retrieves ticker using promise', function (done) {
				client.getTicker('BTCUSD').then((resp) => {
					expect(resp).to.deep.equal(testResponses.ticker.response);
					done();
				});
			});
		});

	});

	describe('pairs', function () {

		context('success call', function () {
			it('retrieves pairs data using cb', function (done) {
				client.getPairs(function (err, resp) {
					expect(resp).to.deep.equal(testResponses.symbols.response);
					done();
				});
			});

			it('retrieves pairs using promise', function (done) {
				client.getPairs().then((resp) => {
					expect(resp).to.deep.equal(testResponses.symbols.response);
					done();
				});
			});
		});

	});

});