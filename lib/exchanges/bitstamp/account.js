const _ = require('lodash');
const parsers = require('../../util/parsers');
const Market = require('../../market');
const path = require('path');
const crypto = require('crypto');

const AccountClient = function (auth, publicURI = 'https://www.bitstamp.net/api/v2') {
  const self = this;

  if (!auth && !(auth.secret && auth.key && auth.customerId)) {
    throw new Error('Invalid or incomplete authentication credentials. You should either provide all of the secret, key and passphrase fields, or leave auth null');
  }

  self.customerId = auth.customerId;
  self.apiKey = auth.key;
  self.apiSecret = auth.secret;

  self.publicURI = publicURI;

  self.body = () => {
    const nonce = new Date().getTime();
    return {
      key: self.apiKey,
      signature: self.signature(nonce),
      nonce: nonce.toString(),
    };
  };

  self.signature = nonce => crypto
    .createHmac('SHA256', self.apiSecret)
    .update(new Buffer(nonce + self.customerId + self.apiKey, 'utf8'))
    .digest('hex')
    .toUpperCase();
};

_.assign(AccountClient.prototype, new function () {
  const prototype = this;

  prototype.info = function (cb) {
    const self = this;
    return parsers.request({
      method: 'POST',
      uri: `${self.publicURI}/balance/`,
      form: self.body(),
      transform: (body) => {
        if (body.status) return body;
        const info = {
          balance: {},
          available: {},
          reserved: {},
          fee: {},
        };
        _.forIn(body, (value, key) => {
          const [asset, attr] = key.split('_');
          info[attr][asset] = parseFloat(value);
        });
        return info;
      },
      json: true,
    }, cb);
  };

  prototype.depositAddress = function (asset, cb) {
    const self = this;
    const endpoint = {
      BTC: 'bitcoin_deposit_address',
      LTC: 'v2/ltc_address',
      XRP: 'v2/xrp_address',
    }[asset.toUpperCase()];
    return parsers.request({
      method: 'POST',
      uri: `https://www.bitstamp.net/api/${endpoint}/`,
      form: self.body(),
      transform: (body) => {
        if (body.status) return body;
        return body.address || body;
      },
      json: true,
    }, cb);
  };
}());


module.exports = exports = AccountClient;
