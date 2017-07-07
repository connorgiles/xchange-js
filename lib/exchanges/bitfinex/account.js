const _  = require('lodash');
const parsers = require('../../util/parsers');
const Market = require('../../market');
const path = require('path');
const crypto = require('crypto');

var AccountClient = function(apiKey, apiSecret, publicURI='https://api.bitfinex.com') {
	let self = this;
	self.apiKey = apiKey;
	self.apiSecret = apiSecret;
	self.publicURI = publicURI;

	self.body = (uri) => {
		return {
			request: `/v1/${ uri }`,
			nonce: (Date.now()*1000).toString()
		}
	}

	self.payload = (body) => {
		return JSON.stringify(new Buffer(JSON.stringify(body)).toString('base64'));
	};

	self.signature = (body) => {
		return crypto
		.createHmac('sha384', self.apiSecret)
		.update(self.payload(body))
		.digest('hex');
	};

	self.headers = (body) => {
		return {
			'X-BFX-APIKEY': self.apiKey,
			'X-BFX-PAYLOAD': self.payload(body),
			'X-BFX-SIGNATURE': self.signature(body)
		};
	};
};

_.assign(AccountClient.prototype, new function() {
	let prototype = this;
	
	prototype.info = function (cb) {
		let self = this;
		let body = self.body('account_infos');
		return parsers.request({
			method: 'POST',
			uri: `${self.publicURI}${ body.request }`,
			headers: self.headers(body),
			json: true
		}, cb);
	};

	prototype.summary = function (cb) {
		let self = this;
		let body = self.body('summary');
		return parsers.request({
			method: 'POST',
			uri: `${self.publicURI}${ body.request }`,
			headers: self.headers(body),
			json: true
		}, cb);
	};

	prototype.balances = function (cb) {
		let self = this;
		let body = self.body('balances');
		return parsers.request({
			method: 'POST',
			uri: `${self.publicURI}${ body.request }`,
			headers: self.headers(body),
			json: true
		}, cb);
	};

	prototype.positions = function (cb) {
		let self = this;
		let body = self.body('positions');
		return parsers.request({
			method: 'POST',
			uri: `${self.publicURI}${ body.request }`,
			headers: self.headers(body),
			json: true
		}, cb);
	};

});



module.exports = exports = AccountClient;