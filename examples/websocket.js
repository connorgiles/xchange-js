const xchange = require('../lib/xchange')

var client = new xchange.Gdax.WebsocketClient();

var pair = 'BTCUSD';
var market;

client.on('open', () => {
	market = client.subscribe(pair);
	market.book.subscribe(5);

	market.book.on('change', (depth, book) => {
		console.log(book);
	});


});


client.on('error', (data) => {
	console.log(data)
})

client.on('close', (data) => {
	console.log('Closed')
})