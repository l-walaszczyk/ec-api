const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const overridesSchema = new Schema({
  day: {
    type: Date,
    required: [true, "day is required and it must be a Date obcject"],
  },
  slotsLocalTime: {
    type: Array,
    required: [true, "slots is required and it must be an array, can be empty"],
  },
});

module.exports = mongoose.model("Overrides", overridesSchema);
