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
      wallet: String,
      amount: Number,
      address: String,
    },
    response: {

    },
  },
  depositAddress: {
    request: {
      currency: String,
      wallet: String
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
