const _  = require('lodash');
const parsers = require('../../util/parsers');

var PublicClient = function(publicURI) {
	let self = this;
	self.publicURI = publicURI || 'https://www.bitstamp.net/api/v2';
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

});



module.exports = exports = PublicClient;