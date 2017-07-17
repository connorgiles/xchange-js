const _ = require('lodash');
const parsers = require('../../util/parsers');
const crypto = require('crypto');

const AccountClient = function (auth, publicURI = 'https://api.bitfinex.com') {
  const self = this;

  if (!auth && !(auth.secret && auth.key)) {
    throw new Error('Invalid or incomplete authentication credentials. You should either provide all of the secret, key and passphrase fields, or leave auth null');
  }

  self.apiKey = auth.key;
  self.apiSecret = auth.secret;
  self.publicURI = publicURI;

  self._nonceIncrement = 0;

  self.body = uri => {
    self._nonceIncrement += 10;
    return {
      request: `/v1/${uri}`,
      nonce: (Date.now() * 1000 + self._nonceIncrement).toString(),
    }
  };

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

    return parsers.requests([{
      method: 'POST',
      uri: `${self.publicURI}${self.body('account_infos').request}`,
      headers: self.headers(self.body('account_infos')),
      json: true,
    },{
      method: 'POST',
      uri: `${self.publicURI}${self.body('balances').request}`,
      headers: self.headers(self.body('balances')),
      json: true,
    }], (responses => {
      let fees = {};
      _.each(responses[0][0].fees, fee => {
        fees[fee.pairs] = {
          maker: parseFloat(fee.maker_fees),
          taker: parseFloat(fee.taker_fees),
        };
      });
      let balances = {};
      _.each(responses[1], balance => {
        balances[balance.currency] = {
          total: parseFloat(balance.amount),
          available: parseFloat(balance.available),
        };
      });
      return {
        fees,
        balances
      };
    }), cb);

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
