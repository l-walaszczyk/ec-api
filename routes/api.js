const express = require("express");
const router = express.Router();
const moment = require("moment");
// const Rules = require("../models/rules");
// const Overrides = require("../models/overrides");
const Meetings = require("../models/meetings");
const purgeTempMeetings = require("../functions/purgeTempMeetings");
const getWeekArray = require("../functions/getWeekArray");
const generateHours = require("../functions/generateHours");
const getHoursFromMeetings = require("../functions/getHoursFromMeetings");
const getRulesAndMeetingsFromDB = require("../functions/getRulesAndMeetingsFromDB");
const emailSender = require("../functions/emailSender");
require("dotenv").config();

// \/ PURGE TEMP MEETINGS \/
router.get("/purge", async (req, res) => {
  const message = await purgeTempMeetings();
  console.log(message);
  res.send(message);
});
// /\ PURGE TEMP MEETINGS /\

// \/ GET WEEK \/
router.get("/week/:mode/", async (req, res) => {
  const { mode } = req.params;

  const { meetingDuration, date: dateQuery, id } = req.query;
  try {
    const [array, success] = await getWeekArray(
      mode,
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
router.post("/", async (req, res) => {
  const { date, meetingDuration } = req.query;

  console.log(`Próba zapisu wizyty.
Data (UTC): ${date}
Długość wizyty: ${meetingDuration} minut`);

  try {
    // \/ POSTING DATA TO DB \/
    const newMeeting = new Meetings({
      meetingDate: moment.utc(date).toDate(),
      meetingDuration,
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
    console.log(availableHours);

    const hoursFromNewMeeting = getHoursFromMeetings(moment.utc(date), [
      savedMeeting,
    ]);
    console.log(hoursFromNewMeeting);

    const hoursInConflict = hoursFromNewMeeting.filter(
      (hour) => !availableHours.includes(hour)
    );

    if (hoursInConflict.length) {
      console.log("Konflikt. Próba usunięcia wstępnie dodanego spotkania.");

      const result = await Meetings.deleteOne({ _id: savedMeeting._id });
      if (result.ok === 1) {
        console.log(
          "Wstępnie dodane spotkanie zostało usunięte, bo było w konflikcie z godzinami przyjęć lub innymi spotkaniami."
        );
      } else {
        console.log("Error while deleting new meeting");
        res.status(500).json({ success: false });
      }

      res.status(409).json({ success: false });
    } else {
      console.log("Brak konfliktu, termin zapisany");
      res.cookie("meetingID", savedMeeting._id, {
        maxAge: 3600,
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.status(201).json({ success: true, savedMeeting });
    }
  } catch (error) {
    console.log("Database error:", error);
    res.status(500).json({ success: false });
  }
});
// /\ BOOK MEETING /\

// \/ SUMMARY \/
router.patch("/summary", async (req, res) => {
  const { id } = req.query;

  console.log("Saving summary for meeting id:", id);

  try {
    // \/ GETTING AND UPDATING DATA FROM DB \/
    const meeting = await Meetings.findById(req.query.id);

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

    res.status(201).json({ success: true });
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ success: false });
  }
});
// /\ SUMMARY /\

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

// \/ MODIFY MEETING \/
router.patch("/", (req, res) => {
  const { date, meetingDuration, id } = req.query;

  console.log(`Próba modyfikacji wizyty.
 ID: ${id}
 Data (UTC): ${date}
 Długość wizyty: ${meetingDuration} minut`);

  res.status(501).json({ success: false });
});
// /\ MODIFY MEETING /\

module.exports = router;
