const _  = require('lodash');
const parsers = require('../../util/parsers');
const normalize = require('./normalize');

var PublicClient = function(publicURI) {
	let self = this;
	self.publicURI = publicURI || 'https://poloniex.com/public?';
};


_.assign(PublicClient.prototype, new function() {
	let prototype = this;
	
	prototype.getTicker = function (pair, cb) {
		let self = this;
		return parsers.request({
			uri: `${self.publicURI}command=returnTicker`,
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

});



module.exports = exports = PublicClient;