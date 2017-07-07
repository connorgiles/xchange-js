var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var orderSchema = new Schema({
  price: Number,
  cnt: Number, 
  amount: Number
},{ _id : false });

var tickSchema = new Schema({
  symbol:  String,
  timestamp: Date,
  exchange: String,
  bids: [orderSchema],
  asks: [orderSchema]
});

module.exports = mongoose.model('Tick', tickSchema);;