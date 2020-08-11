const moment = require("moment");
const Meetings = require("../models/meetings");
const getP24RequestURL = require("../functions/getP24RequestURL");

const handleP24Payment = async (id, meetingDetails, p24, urlUI, urlAPI) => {
  const momentNowUTC = moment.utc().toDate();

  try {
    // \/ GETTING AND UPDATING DATA FROM DB \/
    const meeting = await Meetings.findOne({ _id: id, status: "temp" });

    meeting.meetingDetails = meetingDetails;
    meeting.creationDate = momentNowUTC;

    await meeting.save();
    // /\ GETTING AND UPDATING DATA FROM DB /\

    // \/ CHECKING DATA SAVED IN DB \/
    const checkedMeeting = await Meetings.findOne({
      _id: id,
      status: "temp",
      creationDate: momentNowUTC,
      "meetingDetails.paymentMethod": "p24",
    });
    // /\ CHECKING DATA SAVED IN DB /\

    // requesting url from p24 to redirect the client
    const trnRequestURL = await getP24RequestURL(
      p24,
      urlUI,
      urlAPI,
      id,
      checkedMeeting
    );

    res.status(200).json({
      success: true,
      // savedMeeting: checkedMeeting,
      url: trnRequestURL,
    });
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ success: false });
  }
};

module.exports = handleP24Payment;
