const xchange = require('./lib/xchange')

/*
var client = new xchange.Bitstamp.WebsocketClient();
var pairs = ['ETHBTC', 'LTCBTC', 'XRPBTC']
var markets = [];

client.on('open', () => {
	markets = pairs.map(p => client.subscribe(p));
	console.log(markets);
});

client.on('change', (market) => {
	console.log(market.pair, ':', JSON.stringify(market.topOfBook(), null, ' '));
});
*/
var pClient = new xchange.Bitfinex.PublicClient();

pClient.getTicker('BTCUSD').then(console.log).catch(console.error);