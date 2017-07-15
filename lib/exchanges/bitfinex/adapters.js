module.exports = exports = {
/**
* Helper function to adapt the pair name to the exchange
* @param  {String}  pair    pair to adapt
* @param  {Boolean} reverse whether to reverse the process and revert to exchange
* @return {String}          normalized pair name
*/
  pair: (pair, reverse = false) => pair,

  /**
* Helper function to adapt orderbook price level
* @param  {Array} msg message from socket
* @return {Object}     Object of normalized order
*/
  socketPriceLevel: msg => ({
    id: msg[0],
    price: msg[1],
    amount: Math.abs(msg[2]),
    type: msg[2] >= 0 ? 'bid' : 'ask',
  }),

  /**
* Helper function to adapt orderbook price level
* @param  {Object} msg  price level from public API
* @param  {String} side book side to add to
* @return {Object}      Object of normalized order
*/
  publicPriceLevel: (msg, side) => ({
    id: msg.price,
    price: msg.price,
    amount: msg.amount,
    type: side === 'bids' ? 'bid' : 'ask',
  }),
};
