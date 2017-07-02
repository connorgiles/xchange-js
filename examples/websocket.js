const xchange = require('../lib/xchange')

var client = new xchange.Poloniex.WebsocketClient();

var pair = 'ETHBTC';
var market;

client.on('open', () => {
	market = client.subscribe(pair);
	market.book.subscribe(1);
	market.book.on('change', (depth, book) => {
		console.log(depth);
		console.log(book);
	// Get market's full book
	// console.log(market.pair, ':', JSON.stringify(market.book.depth(5), null, ' '));
});

});

