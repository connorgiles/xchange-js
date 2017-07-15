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
* @param  {Object} msg message from socket
* @return {String}     Object of normalized order
*/
  socketPriceLevel: msg => ({
    id: msg.price,
    amount: msg.amount,
    price: msg.price,
    type: msg.type,
  }),
};
