const _  = require('lodash');
const parsers = require('../../util/parsers');
const Market = require('../../market');
const path = require('path');
const crypto = require('crypto');

var TradeClient = function(apiKey, apiSecret, publicURI='https://api.bitfinex.com') {
	let self = this;
	self.apiKey = apiKey;
	self.apiSecret = apiSecret;
	self.publicURI = publicURI;

	self.body = (uri, params) => {
		let body = {
			request: `/v1/${ uri }`,
			nonce: (Date.now()*1000).toString()
		};
		_.forIn(params, (value, key) => {
			body[key] = value;
		});
		return body;
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

_.assign(TradeClient.prototype, new function() {
	let prototype = this;
	
	prototype.new_order = function (symbol, amount, price=0, side='buy', type='exchange market', cb) {
		let self = this;
		let use_all_available = amount === -1 ? 1 : 0;
		amount = amount.toString();
		price = price.toString();
		let body = self.body('order/new', {
			symbol,
			amount,
			use_all_available,
			price,
			type,
			side,
			exchange: 'bitfinex'
		});
		return parsers.request({
			method: 'POST',
			uri: `${self.publicURI}${ body.request }`,
			headers: self.headers(body),
			json: true
		}, cb);
		
	};

	prototype.order_status = function (order_id, cb) {
		let self = this;
		let body = self.body('order/status', {order_id});
		return parsers.request({
			method: 'POST',
			uri: `${self.publicURI}${ body.request }`,
			headers: self.headers(body),
			json: true
		}, cb);
		
	};


});



module.exports = exports = TradeClient;