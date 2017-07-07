const _  = require('lodash');
const Market = require('../../market');
const path = require('path');

var PublicClient = function(publicURI) {
	let self = this;
	self.publicURI = publicURI || 'https://www.bitstamp.net/api/v2';
	self.supportedPairs = [ 	'BTCUSD',
	'ETHUSD','ETHBTC',
	'LTCUSD','LTCBTC' ];
};


_.assign(PublicClient.prototype, new function() {
	let prototype = this;
	
	prototype.ticker = function (pair, cb) {
		let self = this;

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

});



module.exports = exports = PublicClient;