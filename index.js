const xchange = require('./lib/xchange')

var client = new xchange.Poloniex.WebsocketClient();
var book = {};
client.on('open', () => {
	market = client.subscribe('BTC_ETH');
});


setInterval(() => console.log(market.bookOfDepth(5)), 2000);
