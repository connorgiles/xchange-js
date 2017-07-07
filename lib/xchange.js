const Bitfinex = require('./exchanges/bitfinex');
const Bitstamp = require('./exchanges/bitstamp');
const Poloniex = require('./exchanges/poloniex');
const Gdax = require('./exchanges/gdax');
const Simulator = require('./exchanges/simulator');

module.exports = exports = {
	Bitfinex,
	Bitstamp,
	Poloniex,
	Gdax,
	Simulator
}