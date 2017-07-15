module.exports = exports = {
/**
* Helper function to adapt the pair name to the exchange
* @param  {String}  pair    pair to adapt
* @param  {Boolean} reverse whether to reverse the process and revert to exchange
* @return {String}          normalized pair name
*/
  pair: (pair, reverse = false) => pair,

  /**
* Helper function to normalize the channel name of a pair
* @param  {String} pair pair to get channel for
* @return {String}      channel name for pair
*/
  socketChannel: (pair, raw = false) => {
    pair = pair.toLowerCase();
    const pairName = (pair === 'btcusd' ? '' : `_${pair}`);
    if (raw) return `live_orders${pairName}`;
    return `diff_order_book${pairName}`;
  },

  /**
* Helper function to adapt orderbook price level
* @param  {Object} msg message from socket
* @return {String}     Object of normalized order
*/
  socketPriceLevel: (msg, raw = false) => {
    if (raw) {
      return {
        id: msg.id,
        amount: msg.amount,
        price: msg.price,
        time: parseInt(msg.datetime),
        type: msg.order_type === 0 ? 'bid' : 'ask',
      };
    }

    return {
      id: parseFloat(msg[0]),
      price: parseFloat(msg[0]),
      amount: parseFloat(msg[1]),
      type: msg[2],
    };
  },

  /**
* Helper function to adapt orderbook price level
* @param  {Object} msg  price level from public API
* @param  {String} side book side to add to
* @return {Object}      Object of normalized order
*/
  publicPriceLevel: (msg, side) => ({
    id: parseFloat(msg[0]),
    price: parseFloat(msg[0]),
    amount: parseFloat(msg[1]),
    type: side === 'bids' ? 'bid' : 'ask',
  }),

};
