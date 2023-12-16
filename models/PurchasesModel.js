const mongoose = require("mongoose");

const purchaseSchema = mongoose.Schema({
  user:{
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Must have buyer"]
  },
  course:{
    type: mongoose.Schema.ObjectId,
    ref: "Course",
    required: [true, "Must have course"]
  },
  price: {
    type: Number,
    required: [true, "Must have price"]
  },
  Date: {
    type: Date,
    default: Date.now()
  }
})

purchaseSchema.index({ course: 1, user: 1 }, { unique: true });
module.exports = mongoose.model("Purchase",purchaseSchema)