'use strict';

const _  = require('lodash');
const parsers = require('../../util/parsers');

var PublicClient = function(publicURI) {
	let self = this;
	self.publicURI = publicURI || 'https://www.bitstamp.net/api/v2';
	self.pairs = [ 	'BTCUSD','BTCEUR','EURUSD',
					'XRPUSD','XRPEUR','XRPBTC',
					'LTCUSD','LTCEUR','LTCBTC' ]
};


_.assign(PublicClient.prototype, new function() {
	let prototype = this;
	
	prototype.getTicker = function (pair, cb) {
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

	// btcusd, btceur, eurusd, xrpusd, xrpeur, xrpbtc, ltcusd, ltceur, ltcbtc
	prototype.getPairs = function (cb) {
		let self = this;
		if (!cb) {
			return new Promise((resolve, reject) => {
				return resolve(self.pairs);
			});
		}
		cb(null, self.pairs);
	};

});



module.exports = exports = PublicClient;