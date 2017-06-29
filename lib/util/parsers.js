const rp = require('request-promise');

const request = function(options, cb) {
	if (!cb) {
		return rp(options);
	}
	rp(options)
	.then(body => cb(null, body))
	.catch(err => cb(err));
	return;
};

module.exports = exports = {
	request
}