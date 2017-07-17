const rp = require('request-promise');

/**
 * decorator to allow promises and callbacks
 * @param  {Object}   options Options to be passed to request
 * @param  {Function} cb      Callback on completion
 * @return {Promise}          Promise to evaluate response
 */
 const request = function (options, cb) {
  if (!cb) {
    return new Promise((resolve, reject) => {
      rp(options).then(resolve).catch(err => reject(err.error));
    });
  }
  rp(options)
  .then(body => cb(null, body), err => cb(err.error));
};

/**
 * decorator to use promises and callbacks for multiple chained requests
 * @param  {Array}   options Array of options for requests
 * @param  {Function}   reduce  Function to reduce the responses
 * @param  {Function} cb      Function for completion
 * @return {Promise}          Promise to evaluate response
 */
 const requests = function (options, reduce, cb) {
  const requests = Promise.all(options.map(o => rp(o)));
  if (!cb) {
    return new Promise((resolve, reject) => {
      requests.then(res => resolve(reduce(res))).catch(reject);
    });
  }
  requests.then(body => cb(null, reduce(body)), err => cb(err.error));
};

module.exports = exports = {
  request,
  requests
};
