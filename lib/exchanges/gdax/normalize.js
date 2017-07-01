module.exports = exports = {
	pair: (pair, reverse=false) => {
		if (reverse) {
			return { BTCUSD: 'BTC-USD',
			BTCGBP: 'BTC-GBP',
			BTCEUR: 'BTC-EUR',
			ETHBTC: 'ETH-BTC',
			ETHUSD: 'ETH-USD',
			LTCBTC: 'LTC-BTC',
			LTCUSD: 'LTC-USD',
			ETHEUR: 'ETH-EUR' }[pair]
		}
		return pair.replace('-','');
	}
}