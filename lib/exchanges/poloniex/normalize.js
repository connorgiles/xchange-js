module.exports = exports = {
	pair: (pair, reverse=false) => {
		if (reverse) {
			return `${pair.slice(3,6)}_${pair.slice(0,3)}`;
		}
		let currencies = pair.split('_');
		return currencies[1] + currencies[0];
	}
}