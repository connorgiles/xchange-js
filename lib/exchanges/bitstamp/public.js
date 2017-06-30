const _  = require('lodash');
const parsers = require('../../util/parsers');

var PublicClient = function(publicURI) {
	let self = this;
	self.publicURI = publicURI || 'https://www.bitstamp.net/api/v2';
	self.supportedPairs = [ 	'BTCUSD','BTCEUR','EURUSD',
					'XRPUSD','XRPEUR','XRPBTC',
					'LTCUSD','LTCEUR','LTCBTC' ];
};


_.assign(PublicClient.prototype, new function() {
	let prototype = this;
	
	prototype.ticker = function (pair, cb) {
		let self = this;

		return parsers.request({
			uri: `${self.publicURI}/ticker/${pair}/`,
			json: true,
			transform: body => {
				return {
					last: parseFloat(body.last),
					high: parseFloat(body.high),
					low: parseFloat(body.low),
					bid: parseFloat(body.bid),
					ask: parseFloat(body.ask),
					volume: parseFloat(body.volume),
					time: new Date(parseFloat(body.timestamp)*1000)
				};
			}
		}, cb);
	};

	prototype.pairs = function (cb) {
		let self = this;
		if (!cb) {
			return new Promise((resolve, reject) => {
				return resolve(self.supportedPairs);
			});
		}
		return cb(null, self.supportedPairs);
	};

	prototype.trades = function (pair, interval, cb) {
		let self = this;
		if (typeof(interval) == 'function') {
			cb = interval;
			interval = undefined;
		}
		return parsers.request({
			uri: `${self.publicURI}/transactions/${pair.toLowerCase()}/`,
			qs: {
				time: interval
			},
			json: true,
			transform: body => {
				return body.map(trade => {
					return {
						tid: trade.tid + '',
						type: trade.type === '0' ? 'bid' : 'ask',
						amount: parseFloat(trade.amount),
						pair: pair,
						price: parseFloat(trade.price),
						timestamp: new Date(parseFloat(trade.date)*1000)
					}
				});
			}
		}, cb);
	};

});



module.exports = exports = PublicClient;