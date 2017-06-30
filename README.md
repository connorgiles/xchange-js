# xchange-js [![Build Status](https://travis-ci.org/connorgiles/xchange-js.svg?branch=master)](https://travis-ci.org/connorgiles/xchange-js)
Currently under development. Use at your own risk.

## Exchange Support
- [x] Bitfinex
- [x] Bitstamp
- [x] Poloniex
- [ ] GDAX
- [ ] Kraken

## Websocket Orderbook
Keep a live orderbook for exchanges that support websockets.
```node
const xchange = require('./lib/xchange')

const client = new xchange.Bitstamp.WebsocketClient();
var pairs = ['ETHBTC', 'LTCBTC', 'XRPBTC']

client.on('open', () => {
	pairs.map(p => client.subscribe(p));
});

client.on('change', (market) => {
	console.log(market.pair, ':', JSON.stringify(market.topOfBook(), null, ' '));
});
```
