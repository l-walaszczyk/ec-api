const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const meetingsSchema = new Schema({
  status: { type: String, default: "temp" },
  meetingDate: { type: Date, required: [true, "meetingDate is required"] },
  meetingName: {
    type: String,
    required: [true, "meetingName is required"],
  },
  meetingPrice: {
    type: Number,
    required: [true, "meetingPrice is required, in PLN"],
  },
  meetingDuration: {
    type: Number,
    required: [true, "meetingDuration is required, in minutes"],
  },
  selectedFieldIndex: {
    type: Number,
    required: [true, "selectedFieldIndex is required"],
  },
  numberOfPeople: { type: Number },
  creationDate: { type: Date, default: Date.now },
  // renewalDate: { type: Date },
  meetingDetails: { type: Object },
  emailDetails: { type: Object },
  p24Details: { type: Object },
});

module.exports = mongoose.model("Meetings", meetingsSchema);
