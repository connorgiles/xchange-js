# xchange-js [![Build Status](https://travis-ci.org/connorgiles/xchange-js.svg?branch=master)](https://travis-ci.org/connorgiles/xchange-js) [![npm version](https://badge.fury.io/js/xchange-js.svg)](https://badge.fury.io/js/xchange-js)
Currently under development. Use at your own risk.

# Installation
```
npm install --save xchange-js
```

# Features
## Exchange Support
- [x] Bitfinex
- [x] Bitstamp
- [x] Poloniex
- [ ] GDAX
- [ ] Kraken

## Websocket Orderbook
Keep a live orderbook for exchanges that support websockets.
```node
const xchange = require('xchange-js');
const client = new xchange.Bitstamp.WebsocketClient();
var pairs = ['ETHBTC', 'LTCBTC', 'XRPBTC']
client.on('open', () => {
	pairs.map(p => client.subscribe(p));
});
client.on('change', (market) => {
	console.log(market.pair, ':', JSON.stringify(market.topOfBook(), null, ' '));
	/* Changes look like"
	LTCBTC : {
 		"bid": {
  			"price": 0.0159,
  			"amount": 9.37388993
 		},
 		"ask": {
  			"price": 0.01596187,
  			"amount": 165.972
 		}
	}
	*/
});
```
## Public REST API
### Get Ticker
Standardized API to get ticker information from exchanges.
```node
const xchange = require('xchange-js')
var client = new xchange.Bitstamp.PublicClient();
client.ticker('BTCUSD').then(console.log);
/* Results in
{ last: 2520.42,
  high: 2594.78,
  low: 2500.31,
  bid: 2518.01,
  ask: 2520.27,
  volume: 8991.8225535,
  time: 2017-06-30T08:21:13.000Z }
 */
```
### Get Pairs
Standardized API to get supported pairs from exchanges.
```node
const xchange = require('xchange-js')
var client = new xchange.Bitstamp.PublicClient();
client.pairs().then(console.log);
/* Results in
[ 'BTCUSD',
  'BTCEUR',
  'EURUSD',
  'XRPUSD',
  'XRPEUR',
  'XRPBTC',
  'LTCUSD',
  'LTCEUR',
  'LTCBTC' ]
 */
```
### Get Trades
Standardized API to get trades from exchanges.
```node
const xchange = require('xchange-js')
var client = new xchange.Bitstamp.PublicClient();
client.trades('BTCUSD').then(console.log);
/* Results in
[ ...
  { tid: '16852237',
    type: 'ask',
    amount: 0.20240753,
    pair: 'BTCUSD',
    price: 2516.45,
    timestamp: 2017-06-30T20:04:27.000Z }
    ...
]
 */
```
