const xchange = require('../lib/xchange');

var client = new xchange.Bitstamp.PublicClient();

// client.trades('ETHBTC').then(console.log).catch(console.error);
client.orderbook('LTCBTC').then(m => console.log(m.book.depth(4))).catch(console.error);

// client.pairs().then(console.log).catch(console.error);