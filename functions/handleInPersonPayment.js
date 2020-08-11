const Meetings = require("../models/meetings");
const emailSender = require("../functions/emailSender");

const handleInPersonPayment = async (id, meetingDetails, res) => {
  try {
    // \/ GETTING AND UPDATING DATA FROM DB \/
    const meeting = await Meetings.findOne({ _id: id, status: "temp" });

    meeting.meetingDetails = meetingDetails;
    meeting.status = "unpaid";

    const updatedMeeting = await meeting.save();
    // /\ GETTING AND UPDATING DATA FROM DB /\

    try {
      const messageId = await emailSender(updatedMeeting);

      // \/ GETTING AND UPDATING DATA FROM DB \/
      const checkedMeeting = await Meetings.findOne({
        _id: id,
        status: "unpaid",
      });

      checkedMeeting.emailDetails = { messageId };

      await checkedMeeting.save();
      // /\ GETTING AND UPDATING DATA FROM DB /\
      res.status(201).json({ success: true, savedMeeting: checkedMeeting });
    } catch (error) {
      console.log("Error", error);
      res.status(201).json({ success: true, savedMeeting: updatedMeeting });
    }
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ success: false });
  }
};

module.exports = handleInPersonPayment;
