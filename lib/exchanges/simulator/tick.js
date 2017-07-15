const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  price: Number,
  cnt: Number,
  amount: Number,
}, { _id: false });

const tickSchema = new Schema({
  symbol: String,
  timestamp: Date,
  exchange: String,
  bids: [orderSchema],
  asks: [orderSchema],
});

module.exports = mongoose.model('Tick', tickSchema);
