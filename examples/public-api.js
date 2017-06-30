const xchange = require('../lib/xchange');

var client = new xchange.Bitfinex.PublicClient();

client.ticker('BTCUSD').then(console.log).catch(console.error);
client.pairs().then(console.log).catch(console.error);