var websocket = require('./websocket');

var client = new websocket();
var book = {};
client.on('open', () => {
	market = client.subscribe('BTCUSD');
});

setInterval(() => console.log(market.bookOfDepth(5)), 2000);