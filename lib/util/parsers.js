const rp = require('request-promise');

const request = function(options, cb) {
	if (!cb) {
		return rp(options);
	}
	rp(options)
	.then(body => {
		return cb(null, body)
	}, err => cb(err));
};

module.exports = exports = {
	request
}