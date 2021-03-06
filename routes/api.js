const express = require("express");
const router = express.Router();
const moment = require("moment");
const Meetings = require("../models/meetings");
const purgeTempMeetings = require("../functions/purgeTempMeetings");
const getWeekArray = require("../functions/getWeekArray");
const generateHours = require("../functions/generateHours");
const getHoursFromMeetings = require("../functions/getHoursFromMeetings");
const getRulesAndMeetingsFromDB = require("../functions/getRulesAndMeetingsFromDB");
const emailSender = require("../functions/emailSender");
const handleInPersonPayment = require("../functions/handleInPersonPayment");
const handleP24Payment = require("../functions/handleP24Payment");
require("dotenv").config();
const { Przelewy24 } = require("@ingameltd/node-przelewy24");

const MERCHANT_ID = process.env.P24_ID;
const POS_ID = MERCHANT_ID;
const SALT = process.env.P24_CRC;
const TEST_MODE = process.env.P24_TEST === "true" ? true : false;
const p24 = new Przelewy24(MERCHANT_ID, POS_ID, SALT, TEST_MODE);

// \/ PURGE TEMP MEETINGS \/
router.get("/purge", async (req, res) => {
  const message = await purgeTempMeetings();
  console.log(message);
  res.send(message);
});
// /\ PURGE TEMP MEETINGS /\

// \/ GET WEEK \/
router.get("/hours", async (req, res) => {
  const { direction, meetingDuration, date: dateQuery, id } = req.query;
  console.log(req.originalUrl);

  try {
    const [array, success] = await getWeekArray(
      direction,
      meetingDuration,
      dateQuery,
      id
    );
    res.json({ array, success });
  } catch (error) {
    console.log("Error while getting data from database:", error);
    res.status(500).json({ success: false });
  }
});
// /\ GET WEEK /\

// \/ TEMP-BOOK MEETING \/
router.post("/meetings", async (req, res) => {
  const {
    date,
    meetingName,
    meetingPrice,
    meetingDuration,
    selectedFieldIndex,
    numberOfPeople,
  } = req.body;

  console.log(req.originalUrl);

  console.log(`Attempting to save a meeting.
Date (UTC): ${date}
Duration: ${meetingDuration} minutes`);

  try {
    // \/ POSTING DATA TO DB \/
    const newMeeting = new Meetings({
      meetingDate: moment.utc(date).toDate(),
      meetingName,
      meetingPrice,
      meetingDuration,
      selectedFieldIndex,
      numberOfPeople,
    });

    const savedMeeting = await newMeeting.save();
    // /\ POSTING DATA TO DB /\

    // \/ GETTING DATA FROM DB \/
    const [
      { generalRuleLocalTime },
      ruleOverrides,
      meetings,
    ] = await getRulesAndMeetingsFromDB(
      moment.utc(date).startOf("day").toDate(),
      moment.utc(date).endOf("day").toDate(),
      savedMeeting,
      false
    );
    // /\ GETTING DATA FROM DB /\

    const allBlocks = true;

    const availableHours = generateHours(
      moment.utc(date),
      meetingDuration,
      generalRuleLocalTime,
      ruleOverrides,
      meetings,
      allBlocks
    );
    // console.log(availableHours);

    const hoursFromNewMeeting = getHoursFromMeetings(moment.utc(date), [
      savedMeeting,
    ]);
    // console.log(hoursFromNewMeeting);

    const hoursInConflict = hoursFromNewMeeting.filter(
      (hour) => !availableHours.includes(hour)
    );

    if (hoursInConflict.length) {
      console.log("Conflict. Attempting to delete the preliminary entry.");

      const result = await Meetings.deleteOne({ _id: savedMeeting._id });
      if (result.ok === 1) {
        console.log(
          "Preliminary entry has been deleted, because it was in conflict with opening hours or other meetings."
        );
      } else {
        console.log("Error while deleting the preliminary entry.");
        res.status(500).json({ success: false });
      }

      res.status(409).json({ success: false });
    } else {
      console.log("No conflict. Meeting saved.");
      res.status(201).json({ success: true, savedMeeting });
    }
  } catch (error) {
    console.log("Database error:", error);
    res.status(500).json({ success: false });
  }
});
// /\ TEMP-BOOK MEETING /\

// \/ DELETE MEETING \/
router.delete("/meetings/:id", async (req, res) => {
  const { id } = req.params;
  // const { status } = req.query;

  try {
    const result = await Meetings.deleteOne({ _id: id, status: "temp" });
    if (result.ok === 1) {
      console.log("Successfully deleted temp meeting id", id);
      res.status(200).json({ success: true });
    } else {
      throw new Error(`Could not delete a meeting id ${id}`);
    }
  } catch (error) {
    res.status(404).json({ success: false });
  }
});
// /\ DELETE MEETING /\

// \/ GET MEETING \/
router.get("/meetings/:id", async (req, res) => {
  const { id } = req.params;
  console.log(req.originalUrl);

  try {
    // const savedMeeting = await Meetings.findOne({ _id: id, status: "temp" });
    const savedMeeting = await Meetings.findById(id);
    if (savedMeeting) {
      res.status(200).json({ success: true, savedMeeting });
    } else {
      console.log("Could not find a temp meeting of id", id);
      res.status(404).json({ success: false });
    }
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ success: false });
  }
});
// /\ GET MEETING /\

// \/ FINAL-BOOK MEETING \/
router.patch("/meetings/:id", async (req, res) => {
  console.log(req.originalUrl);

  const { id } = req.params;
  console.log("Saving summary for meeting id:", id);

  try {
    const meetingDetails = { ...req.body };
    const { paymentMethod } = meetingDetails;

    if (paymentMethod === "in-person") {
      handleInPersonPayment(id, meetingDetails, res);
    } else if (paymentMethod === "p24") {
      const urlUI = req.headers.origin;
      const urlAPI = req.protocol + "://" + req.headers.host + "/api";

      handleP24Payment(id, meetingDetails, p24, urlUI, urlAPI, res);
    } else {
      throw new Error(
        "Neither 'in-person' nor 'p24' payment method has been specified in the request."
      );
    }
  } catch (error) {
    console.log("Error", error);
    res.status(400).json({ success: false });
  }
});
// /\ FINAL-BOOK MEETING /\

// \/ PRZELEWY24 STATUS \/
router.post("/p24status", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");

  const {
    p24_session_id: id,
    p24_amount,
    p24_currency,
    p24_order_id,
    p24_sign,
    p24_statement,
  } = req.body;

  console.log("Successful payment for meeting id:", id);

  const verification = {
    p24_session_id: id,
    p24_amount,
    p24_currency,
    p24_order_id,
    p24_sign,
  };

  try {
    const result = await p24.verifyTransaction(verification);
    console.log("Verification successful:", result);

    // \/ GETTING AND UPDATING DATA FROM DB \/
    const meeting = await Meetings.findOne({
      _id: id,
      status: "temp",
      "meetingDetails.paymentMethod": "p24",
    });

    meeting.status = "paid";
    meeting.p24Details = { p24_order_id, p24_statement };

    const updatedMeeting = await meeting.save();
    // /\ GETTING AND UPDATING DATA FROM DB /\

    try {
      const messageId = await emailSender(updatedMeeting);

      // \/ GETTING AND UPDATING DATA FROM DB \/
      const checkedMeeting = await Meetings.findOne({
        _id: id,
        status: "paid",
      });

      checkedMeeting.emailDetails = { messageId };

      await checkedMeeting.save();
      // /\ GETTING AND UPDATING DATA FROM DB /\
    } catch (error) {
      console.log("Error", error);
    }

    res.status(201).send();
  } catch (error) {
    console.log("Error", error);
    res.status(500).send();
  }
});
// /\ PRZELEWY24 STATUS /\

// \/ EMAIL DELIVERED \/
router.post("/delivered", async (req, res) => {
  const { email } = req.body;
  const messageId = req.body["message-id"];

  console.log(`Email delivered to ${email}; messageId: ${messageId}`);

  const emailsArrayBCC = process.env.EMAIL_BCC.split(", ");

  if (emailsArrayBCC.filter((item) => item === email).length === 0) {
    try {
      // \/ GETTING AND UPDATING DATA FROM DB \/
      const meeting = await Meetings.findOne({
        emailDetails: { messageId },
      });
      // console.log(meeting);
      meeting.emailDetails = { messageId, delivered: true };
      console.log(
        `Meeting ID ${meeting._id} confirmation message delivered to ${email}`
      );

      await meeting.save();
      // /\ GETTING AND UPDATING DATA FROM DB /\

      res.status(201).send("created");
    } catch (error) {
      console.log("Error:", error);
      res.status(500).send();
    }
  } else {
    res.status(200).send();
  }
});
// /\ EMAIL DELIVERED /\

module.exports = router;
