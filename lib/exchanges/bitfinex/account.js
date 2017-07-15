const _ = require('lodash');
const parsers = require('../../util/parsers');
const crypto = require('crypto');

const AccountClient = function (apiKey, apiSecret, publicURI = 'https://api.bitfinex.com') {
  const self = this;
  self.apiKey = apiKey;
  self.apiSecret = apiSecret;
  self.publicURI = publicURI;

  self.body = uri => ({
    request: `/v1/${uri}`,
    nonce: (Date.now() * 1000).toString(),
  });

  self.payload = body => JSON.stringify(new Buffer(JSON.stringify(body)).toString('base64'));

  self.signature = body => crypto
    .createHmac('sha384', self.apiSecret)
    .update(self.payload(body))
    .digest('hex');

  self.headers = body => ({
    'X-BFX-APIKEY': self.apiKey,
    'X-BFX-PAYLOAD': self.payload(body),
    'X-BFX-SIGNATURE': self.signature(body),
  });
};

_.assign(AccountClient.prototype, new function () {
  const prototype = this;

  prototype.info = function (cb) {
    const self = this;
    const body = self.body('account_infos');
    return parsers.request({
      method: 'POST',
      uri: `${self.publicURI}${body.request}`,
      headers: self.headers(body),
      json: true,
    }, cb);
  };

  prototype.summary = function (cb) {
    const self = this;
    const body = self.body('summary');
    return parsers.request({
      method: 'POST',
      uri: `${self.publicURI}${body.request}`,
      headers: self.headers(body),
      json: true,
    }, cb);
  };

  prototype.balances = function (cb) {
    const self = this;
    const body = self.body('balances');
    return parsers.request({
      method: 'POST',
      uri: `${self.publicURI}${body.request}`,
      headers: self.headers(body),
      json: true,
    }, cb);
  };

  prototype.positions = function (cb) {
    const self = this;
    const body = self.body('positions');
    return parsers.request({
      method: 'POST',
      uri: `${self.publicURI}${body.request}`,
      headers: self.headers(body),
      json: true,
    }, cb);
  };
}());


module.exports = exports = AccountClient;
