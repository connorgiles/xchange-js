const PublicClient = {
  pairs: {
    request: {},
    response: [String],
  },
  ticker: {
    request: {
      pair: String,
    },
    response: {
      last: Number,
      high: Number,
      low: Number,
      bid: Number,
      ask: Number,
      volume: Number,
      time: Date,
    },
  },
  trades: {
    request: {
      pair: String,
    },
    response: [{
      tid: String,
      type: ['bid', 'ask'],
      amount: Number,
      pair: String,
      price: Number,
      timestamp: Date,
    }],
  },
  orderbook: {
    request: {
      pair: String,
    },
    response: Market,
  },
};
