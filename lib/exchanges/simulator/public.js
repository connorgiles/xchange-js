const _ = require('lodash');
const Market = require('../../market');
const path = require('path');

const PublicClient = function (publicURI) {
  const self = this;
  self.publicURI = publicURI || 'https://www.bitstamp.net/api/v2';
  self.supportedPairs = ['BTCUSD',
    'ETHUSD', 'ETHBTC',
    'LTCUSD', 'LTCBTC'];
};


_.assign(PublicClient.prototype, new function () {
  const prototype = this;

  prototype.ticker = function (pair, cb) {
    const self = this;
  };

  prototype.pairs = function (cb) {
    const self = this;
    if (!cb) {
      return new Promise((resolve, reject) => resolve(self.supportedPairs));
    }
    return cb(null, self.supportedPairs);
  };
}());


module.exports = exports = PublicClient;
