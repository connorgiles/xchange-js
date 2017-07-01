const xchange = require('../lib/xchange');

var client = new xchange.Bitfinex.PublicClient();

client.trades('ETHBTC').then(console.log).catch(console.error);
// client.orderbook('ETHBTC').then(m => console.log(m.bookOfDepth(5))).catch(console.error);

// client.pairs().then(console.log).catch(console.error);