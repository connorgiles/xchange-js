const _ = require('lodash');
const parsers = require('../../util/parsers');
const adapters = require('./adapters');

const headers = {
  'User-Agent': 'xchange-js',
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const TradeClient = function (auth, publicURI = 'https://api.gdax.com') {
  const self = this;

  if (!auth && !(auth.secret && auth.key)) {
    throw new Error('Invalid or incomplete authentication credentials. You should either provide all of the secret, key and passphrase fields, or leave auth null');
  }

  self.apiKey = auth.key;
  self.apiSecret = auth.secret;
  self.publicURI = publicURI;

};

_.assign(TradeClient.prototype, new function () {
  const prototype = this;

  prototype.openOrders = function (cb) {
    throw new Error('Not implemented');
  };

  prototype.marketOrder = function (cb) {
    throw new Error('Not implemented');
  };

  prototype.limitOrder = function (cb) {
    throw new Error('Not implemented');
  };

  prototype.tradeHistory = function (cb) {
    throw new Error('Not implemented');
  };

  prototype.order = function (cb) {
    throw new Error('Not implemented');
  };

}());


module.exports = exports = TradeClient;
