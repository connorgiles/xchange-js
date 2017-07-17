const _ = require('lodash');
const parsers = require('../../util/parsers');
const adapters = require('./adapters');

const AccountClient = function (auth, publicURI) {
  const self = this;

  if (!auth && !(auth.secret && auth.key)) {
    throw new Error('Invalid or incomplete authentication credentials. You should either provide all of the secret, key and passphrase fields, or leave auth null');
  }

  self.apiKey = auth.key;
  self.apiSecret = auth.secret;
  self.publicURI = publicURI;

};

_.assign(AccountClient.prototype, new function () {
  const prototype = this;

  prototype.info = function (cb) {
    throw new Error('Not implemented');
  };

  prototype.withdraw = function (cb) {
    throw new Error('Not implemented');
  };

  prototype.depositAddress = function (cb) {
    throw new Error('Not implemented');
  };

  prototype.fundingHistory = function (cb) {
    throw new Error('Not implemented');
  };

}());


module.exports = exports = AccountClient;
