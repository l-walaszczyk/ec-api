const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const rulesSchema = new Schema({
  generalRuleLocalTime: {
    type: Array,
    required: [
      true,
      "generalRuleLocalTime is required and it must be a 7-element array",
    ],
  },
  limitingHourHowManyDaysBefore: {
    type: Number,
    required: [
      true,
      "limitingHourHowManyDaysBefore is required and it must be a number",
    ],
  },
  limitingHourLocalTime: {
    type: Number,
    required: [
      true,
      "limitingHourLocalTime is required and it must be a number",
    ],
  },
});

module.exports = mongoose.model("Rules", rulesSchema);
