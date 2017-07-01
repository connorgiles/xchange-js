const rp = require('request-promise');

const request = function(options, cb) {
	if (!cb) {
		return new Promise((resolve, reject) => {
			rp(options).then(resolve).catch(err => reject(err.error));
		});
	}
	rp(options)
	.then(body => {
		return cb(null, body)
	}, err => cb(err.error));
};

module.exports = exports = {
	request
}