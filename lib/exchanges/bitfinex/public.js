'use strict';

const _  = require('lodash');
const parsers = require('../../util/parsers');

var PublicClient = function(publicURI) {
	let self = this;
	self.publicURI = publicURI || 'https://api.bitfinex.com/v1';
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
					last: parseFloat(body.last_price),
					high: null,
					low: null,
					bid: parseFloat(body.bid),
					ask: parseFloat(body.ask),
					volume: null,
					time: new Date(parseFloat(body.timestamp)*1000)
				};
			}
		}, cb);
	};

	prototype.pairs = function (cb) {
		let self = this;

		return parsers.request({
			uri: `${self.publicURI}/symbols/`,
			json: true,
			transform: body => body.map(b=>b.toUpperCase())
		}, cb);
	};

});



module.exports = exports = PublicClient;