const _  = require('lodash');
const parsers = require('../../util/parsers');
const Market = require('../../market');
const path = require('path');
const crypto = require('crypto');

var AccountClient = function(auth, publicURI='https://www.bitstamp.net/api/v2') {
	let self = this;

	if (!auth && !(auth.secret && auth.key && auth.customerId)) {
		throw new Error('Invalid or incomplete authentication credentials. You should either provide all of the secret, key and passphrase fields, or leave auth null');
	}

	self.customerId = auth.customerId;
	self.apiKey = auth.key;
	self.apiSecret = auth.secret;

	self.publicURI = publicURI;

	self.body = () => {
		let nonce = new Date().getTime();
		return {
			key: self.apiKey,
			signature: self.signature(nonce),
			nonce: nonce.toString()
		};
	};

	self.signature = (nonce) => {
		return crypto
		.createHmac('SHA256', self.apiSecret)
		.update(new Buffer(nonce + self.customerId + self.apiKey, 'utf8'))
		.digest('hex')
		.toUpperCase();
	};

};

_.assign(AccountClient.prototype, new function() {
	let prototype = this;

	prototype.openOrders = function (pair='all', cb) {
		let self = this;
		return parsers.request({
			method: 'POST',
			uri: `${self.publicURI}/open_orders/${pair}/`,
			form: self.body(),
			transform: (body) => {
				return body;
			},
			json: true
		}, cb);
	};

	prototype.marketOrder = function (type, amount, pair, cb) {
		let self = this;
		let body = self.body();
		body['type'] = type === 'ask' ? 1 : 0;
		body['amount'] = amount;
		
		return parsers.request({
			method: 'POST',
			uri: `${self.publicURI}/${type === 'ask' ? 'sell' : 'buy'}/market/${pair.toLowerCase()}/`,
			form: body,
			transform: (body) => {
				return body;
			},
			json: true
		}, cb);
		
	};

	prototype.limitOrder = function (type, amount, price, pair, cb) {
		let self = this;
		let body = self.body();
		body['type'] = type === 'ask' ? 1 : 0;
		body['amount'] = amount;
		body['price'] = price;
		
		return parsers.request({
			method: 'POST',
			uri: `${self.publicURI}/${type === 'ask' ? 'sell' : 'buy'}/market/${pair.toLowerCase()}/`,
			form: body,
			transform: (body) => {
				return body;
			},
			json: true
		}, cb);
		
	};

});



module.exports = exports = AccountClient;