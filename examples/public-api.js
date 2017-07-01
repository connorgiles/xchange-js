const xchange = require('../lib/xchange');

var client = new xchange.Poloniex.PublicClient();

// client.ticker('ETHBTC').then(console.log).catch(console.error);
client.orderbook('ETHBTC').then(m => console.log(m.topOfBook())).catch(console.error);

// client.pairs().then(console.log).catch(console.error);