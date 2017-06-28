var websocket = require('./websocket');

var client = new websocket();
var book = {};
client.on('open', () => {
	eth = client.subscribe('BTC_ETH');
	ltc = client.subscribe('BTC_LTC');
});


setInterval(() => console.log('ETH', eth.bookOfDepth(5)), 2000);
setInterval(() => console.log('LTC', ltc.bookOfDepth(5)), 2000);
