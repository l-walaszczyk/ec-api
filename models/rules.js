const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const rulesSchema = new Schema({
  generalRule: {
    type: Array,
    required: [
      true,
      "generalRule is required and it must be a 7-element array",
    ],
  },
  limitingUTCHour: {
    type: Number,
    required: [true, "limitingUTCHour is required and it must be a number"],
  },
});

module.exports = mongoose.model("Rules", rulesSchema);
