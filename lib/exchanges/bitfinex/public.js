const _  = require('lodash');
const parsers = require('../../util/parsers');

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
					last: parseFloat(body[pair].last),
					high: parseFloat(body[pair].high24hr),
					low: parseFloat(body[pair].low24hr),
					bid: parseFloat(body[pair].highestBid),
					ask: parseFloat(body[pair].lowestAsk),
					volume: null,
					time: new Date()
				};
			}
		}, cb);
	};

});



module.exports = exports = PublicClient;