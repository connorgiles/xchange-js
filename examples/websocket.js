const xchange = require('../lib/xchange')

var client = new xchange.Bitfinex.WebsocketClient();

var pairs = ['BTCUSD']
var markets = [];

client.on('open', () => {
	markets = pairs.map(p => client.subscribeRaw(p));
});

client.on('change', (market) => {
	// Get market's full book
	console.log(market.pair, ':', JSON.stringify(market.book.state(), null, ' '));
});
