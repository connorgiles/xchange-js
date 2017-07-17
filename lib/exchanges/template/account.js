const AccountClient = {
  info: {
    request: {},
    response: {
      fees: {
        [asset]: {
          maker: Number,
          taker: Number
        }
      },
      wallets: {
        [asset]: {
          total: Number,
          available: Number
        }
      }
    },
  },
  withdraw: {
    request: {
      currency: String,
      amount: Number,
      address: String,
    },
    response: {

    },
  },
  depositAddress: {
    request: {
      currency: String,
    },
    response: {

    },
  },
  fundingHistory: {
    request: {

    },
    response: {

    },
  },
};
