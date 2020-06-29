const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const meetingsSchema = new Schema({
  creationDate: { type: Date, default: Date.now },
  meetingDate: { type: Date, required: [true, "meetingDate is required"] },
  meetingDuration: {
    type: Number,
    required: [true, "meetingDuration is required, in minutes"],
  },
  status: String,
});

module.exports = mongoose.model("Meetings", meetingsSchema);
