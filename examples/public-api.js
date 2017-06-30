const xchange = require('../lib/xchange');

var client = new xchange.Poloniex.PublicClient();

client.ticker('ETHBTC').then(console.log).catch(console.error);
client.trades('NXTBTC').then(console.log).catch(console.error);

client.pairs().then(console.log).catch(console.error);