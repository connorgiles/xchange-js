module.exports = exports = {
/**
* Helper function to adapt the pair name to the exchange
* @param  {String}  pair    pair to adapt
* @param  {Boolean} reverse whether to reverse the process and revert to exchange
* @return {String}          normalized pair name
*/
pair: (pair, reverse=false) => {
	if (reverse) {
		return { BTCUSD: 'BTC-USD',
		BTCGBP: 'BTC-GBP',
		BTCEUR: 'BTC-EUR',
		ETHBTC: 'ETH-BTC',
		ETHUSD: 'ETH-USD',
		LTCBTC: 'LTC-BTC',
		LTCUSD: 'LTC-USD',
		ETHEUR: 'ETH-EUR' }[pair];
	}
	return pair.replace('-','');
},

/**
* Helper function to adapt orderbook price level
* @param  {Object} msg message from socket
* @return {String}     Object of normalized order
*/
socketPriceLevel: (msg) => {
	return {
		id: msg.order_id, 
		price: parseFloat(msg.price), 
		amount:  parseFloat(msg.size), 
		type: msg.side === 'sell' ? 'ask' : 'bid', 
		time: new Date(msg.time)
	};
}
}