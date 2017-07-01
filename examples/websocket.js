const xchange = require('../lib/xchange')

var client = new xchange.Poloniex.WebsocketClient();

var pairs = ['XRPBTC']
var markets = [];

client.on('open', () => {
	markets = pairs.map(p => client.subscribe(p));
});

client.on('change', (market) => {
	// Get market's full book
	console.log(market.pair, ':', JSON.stringify(market.book.depth(5), null, ' '));
});
