const _ = require('lodash');
const parsers = require('../../util/parsers');
const Market = require('../../market');
const path = require('path');
const crypto = require('crypto');

const TradeClient = function (auth, publicURI = 'https://api.bitfinex.com') {
  const self = this;
  
  if (!auth && !(auth.secret && auth.key)) {
    throw new Error('Invalid or incomplete authentication credentials. You should either provide all of the secret, key and passphrase fields, or leave auth null');
  }

  self.apiKey = auth.key;
  self.apiSecret = auth.secret;
  self.publicURI = publicURI;

  self._nonceIncrement = 0;

  self.body = (uri, args={}) => {
    self._nonceIncrement += 1000;
    return _.merge({
      request: `/v1/${uri}`,
      nonce: (Date.now() * 1000 + self._nonceIncrement).toString(),
    }, args);
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

_.assign(TradeClient.prototype, new function () {
  const prototype = this;

  prototype.openOrders = function (cb) {
    const self = this;
    const body = self.body('orders');
    return parsers.request({
      method: 'POST',
      uri: `${self.publicURI}${body.request}`,
      headers: self.headers(body),
      json: true,
      transform: body => body
    }, cb);
  };

  prototype.marketOrder = function (symbol, amount, side, useMargin=false, cb) {
    return this._placeOrder(symbol, amount, 1, side, `${useMargin ? '' : 'exchange '}market`, cb);
  };

  prototype.limitOrder = function (symbol, amount, price, side, useMargin=false, cb) {
    return this._placeOrder(symbol, amount, price, side, `${useMargin ? '' : 'exchange '}limit`, cb);
  };

  prototype.tradeHistory = function (cb) {
    throw new Error('Not implemented');
  };

  prototype.order = function (order_id, cb) {
    const self = this;
    const body = self.body('order/status', { order_id });
    return parsers.request({
      method: 'POST',
      uri: `${self.publicURI}${body.request}`,
      headers: self.headers(body),
      json: true,
      transform: body => body
    }, cb);
  };

  prototype._placeOrder = function (symbol, amount, price = 0, side = 'buy', type = 'exchange market', cb) {
  const self = this;
  const use_all_available = amount === -1 ? 1 : 0;
  amount = amount.toString();
  price = price.toString();
  const body = self.body('order/new', {
    symbol,
    amount,
    use_all_available,
    price,
    type,
    side,
    exchange: 'bitfinex',
  });
  return parsers.request({
    method: 'POST',
    uri: `${self.publicURI}${body.request}`,
    headers: self.headers(body),
    json: true,
  }, cb);
};


}());

module.exports = exports = TradeClient;
