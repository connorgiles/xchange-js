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
const xchange = require('./lib/xchange')
var client = new xchange.Bitfinex.PublicClient();
client.getTicker('BTCUSD').then(console.log);
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
