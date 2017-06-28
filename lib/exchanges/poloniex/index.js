var websocket = require('./websocket');

var client = new websocket();
var book = {};
client.on('open', () => {
	market = client.subscribe('BTC_ETH');
});

setInterval(() => console.log(market.bookOfDepth(5)), 2000);