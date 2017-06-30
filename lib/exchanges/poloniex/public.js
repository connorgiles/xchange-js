const _  = require('lodash');
const parsers = require('../../util/parsers');
const normalize = require('./normalize');

var PublicClient = function(publicURI) {
	let self = this;
	self.publicURI = publicURI || 'https://poloniex.com';
};


_.assign(PublicClient.prototype, new function() {
	let prototype = this;
	
	prototype.ticker = function (pair, cb) {
		let self = this;
		return parsers.request({
			uri: `${self.publicURI}/public?command=returnTicker`,
			json: true,
			transform: body => {
				return {
					last: parseFloat(body[normalize.pair(pair, true)].last),
					high: parseFloat(body[normalize.pair(pair, true)].high24hr),
					low: parseFloat(body[normalize.pair(pair, true)].low24hr),
					bid: parseFloat(body[normalize.pair(pair, true)].highestBid),
					ask: parseFloat(body[normalize.pair(pair, true)].lowestAsk),
					volume: null,
					time: new Date()
				};
			}
		}, cb);
	};

	prototype.pairs = function (cb) {
		let self = this;

		return parsers.request({
			uri: `${self.publicURI}/public?command=returnTicker`,
			json: true,
			transform: body => Object.keys(body).map(b => normalize.pair(b))
		}, cb);
	};

});



module.exports = exports = PublicClient;