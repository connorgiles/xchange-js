const xchange = require('../lib/xchange')

var client = new xchange.Bitstamp.WebsocketClient();

var pairs = ['BTCUSD']
var markets = [];

client.on('open', () => {
	markets = pairs.map(p => client.subscribe(p));
});

client.on('change', (market) => {
	// Get market's full book
	console.log(market.pair, ':', JSON.stringify(market.book.depth(2), null, ' '));
});
