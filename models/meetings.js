const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const meetingsSchema = new Schema({
  status: { type: String, default: "temp" },
  meetingDate: { type: Date, required: [true, "meetingDate is required"] },
  meetingDuration: {
    type: Number,
    required: [true, "meetingDuration is required, in minutes"],
  },
  creationDate: { type: Date, default: Date.now },
  meetingDetails: { type: Object },
  emailDetails: { type: Object },
});

module.exports = mongoose.model("Meetings", meetingsSchema);
