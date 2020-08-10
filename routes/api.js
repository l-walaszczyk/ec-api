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
const przelewy24 = require("../functions/przelewy24");
const url = require("url");
require("dotenv").config();

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

// \/ BOOK MEETING \/
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
      // res.cookie("meetingID", savedMeeting._id, {
      //   maxAge: 1000 * 60 * 60,
      //   httpOnly: false,
      //   sameSite: "none",
      //   secure: true,
      // });
      res.status(201).json({ success: true, savedMeeting });
    }
  } catch (error) {
    console.log("Database error:", error);
    res.status(500).json({ success: false });
  }
});
// /\ BOOK MEETING /\

// \/ DELETE MEETING \/
router.delete("/meetings/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.query;

  if (status === "temp") {
    try {
      const result = await Meetings.deleteOne({ _id: id });
      if (result.ok === 1) {
        console.log("Successfully deleted temp meeting id", id);
        res.status(200).json({ success: true });
      } else {
        console.log("Error while deleting temp meeting id", id);
        res.status(404).json({ success: false });
      }
    } catch (error) {}
  } else {
    res.status(400).json({ success: false });
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

// \/ PAYMENT IN PERSON \/
router.patch("/meetings/:id/in-person", async (req, res) => {
  console.log(req.originalUrl);

  const { id } = req.params;

  console.log("Saving summary for meeting id:", id);

  try {
    // \/ GETTING AND UPDATING DATA FROM DB \/
    const meeting = await Meetings.findOne({ _id: id, status: "temp" });

    meeting.meetingDetails = { ...req.body };
    meeting.status = "unpaid";

    const updatedMeeting = await meeting.save();
    // /\ GETTING AND UPDATING DATA FROM DB /\

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
    res.status(500).json({ success: false });
  }
});
// /\ PAYMENT IN PERSON /\

// \/ EMAIL DELIVERED \/
router.post("/delivered", async (req, res) => {
  const { email } = req.body;
  const messageId = req.body["message-id"];
  console.log("Email delivered, messageId:", messageId);

  if (email !== process.env.EMAIL_BCC) {
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
      res.status(500).send("Database error");
    }
  } else {
    res.status(200).send("ok");
  }
});
// /\ EMAIL DELIVERED /\

// \/ PRZELEWY24 \/
router.patch("/meetings/:id/p24", async (req, res) => {
  console.log(req.originalUrl);

  const urlUI = req.headers.origin;
  console.log(urlUI);

  const urlAPI = req.protocol + "://" + req.headers.host + "/api";
  console.log(urlAPI);

  const { id } = req.params;
  // const meetingDetails = req.body;
  console.log("Saving summary for meeting id:", id);

  try {
    // \/ GETTING AND UPDATING DATA FROM DB \/
    const meeting = await Meetings.findOne({ _id: id, status: "temp" });

    meeting.meetingDetails = { ...req.body };
    meeting.status = "unpaid";

    await meeting.save();
    // /\ GETTING AND UPDATING DATA FROM DB /\

    // \/ CHECKING DATA SAVED IN DB \/
    const checkedMeeting = await Meetings.findOne({
      _id: id,
      status: "unpaid",
    });
    // /\ CHECKING DATA SAVED IN DB /\

    const trnRequestURL = await przelewy24(urlUI, urlAPI, id, checkedMeeting);

    res.status(200).json({
      success: true,
      savedMeeting: checkedMeeting,
      url: trnRequestURL,
    });
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ success: false });
  }
});
// /\ PRZELEWY24 /\

// \/ PRZELEWY24 STATUS \/
router.post("/p24status", async (req, res) => {
  const { p24_session_id: id, p24_order_id, p24_statement } = req.query;

  console.log("Successful payment for meeting id:", id);

  try {
    // \/ GETTING AND UPDATING DATA FROM DB \/
    const meeting = await Meetings.findOne({
      _id: id,
      status: "unpaid",
    });

    meeting.status = "paid";
    meeting.p24Details = { p24_order_id, p24_statement };

    const updatedMeeting = await meeting.save();
    // /\ GETTING AND UPDATING DATA FROM DB /\

    const messageId = await emailSender(updatedMeeting);

    // \/ GETTING AND UPDATING DATA FROM DB \/
    const checkedMeeting = await Meetings.findOne({
      _id: id,
      status: "paid",
    });

    checkedMeeting.emailDetails = { messageId };

    await checkedMeeting.save();
    // /\ GETTING AND UPDATING DATA FROM DB /\

    res.status(201).json({ success: true });
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ success: false });
  }
});
// /\ PRZELEWY24 STATUS /\

module.exports = router;
