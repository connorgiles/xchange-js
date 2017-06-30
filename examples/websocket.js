const xchange = require('../lib/xchange')

var client = new xchange.Bitfinex.WebsocketClient();

var pairs = ['BTCUSD', 'LTCBTC', 'XRPBTC']
var markets = [];

client.on('open', () => {
	markets = pairs.map(p => client.subscribe(p));
	console.log(markets);
});

client.on('change', (market) => {
	// Get market's full book
	console.log(market.pair, ':', JSON.stringify(market.bookOfDepth(), null, ' '));
	// Get market's book 5 prices deep
	console.log(market.pair, ':', JSON.stringify(market.bookOfDepth(5), null, ' '));
	// Get market's top of book
	console.log(market.pair, ':', JSON.stringify(market.topOfBook(), null, ' '));
});
