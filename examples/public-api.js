const xchange = require('../lib/xchange');

var client = new xchange.Bitstamp.PublicClient();

// client.ticker('ETHBTC').then(console.log).catch(console.error);
client.trades('BTCUSD').then(console.log).catch(console.error);

// client.pairs().then(console.log).catch(console.error);