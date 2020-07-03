const express = require("express");
const router = express.Router();
const moment = require("moment");
const Rules = require("../models/rules");
const Overrides = require("../models/overrides");
const Meetings = require("../models/meetings");
const getWeekArray = require("../controllers/getWeekArray");

router.get("/:mode/", async (req, res) => {
  const { mode } = req.params;
  console.log(mode);

  const { meetingDuration, date: dateQuery } = req.query;
  console.log("meetingDuration:", meetingDuration, "minutes");
  console.log("dateQuery:", dateQuery);

  // \/ GETTING DATA FROM DB \/
  const rules = await Rules.findOne({}, (err, rules) => {
    if (err) {
      res.status(404).send("Database error");
      return console.log("Error while importing Rules from db: ", err);
    }
    return rules;
  });

  const ruleOverrides = await Overrides.find(
    {
      day: {
        $gte: moment.utc().toDate(),
        $lte: moment.utc().add(1, "month").endOf("month").toDate(),
      },
    },
    (err, ruleOverrides) => {
      if (err) {
        res.status(404).send("Database error");
        return console.log("Error while importing Overrides from db: ", err);
      }
      return ruleOverrides;
    }
  );

  const meetings = await Meetings.find(
    {
      meetingDate: {
        $gte: moment.utc().toDate(),
        $lte: moment.utc().add(1, "month").endOf("month").toDate(),
      },
    },
    (err, meetings) => {
      if (err) {
        res.status(404).send("Database error");
        return console.log("Error while importing Meetings from db: ", err);
      }
      return meetings;
    }
  );
  // /\ GETTING DATA FROM DB /\

  const array = getWeekArray(
    mode,
    meetingDuration,
    dateQuery,
    rules,
    ruleOverrides,
    meetings
  );
  console.log(array);

  res.json(array);
});

module.exports = router;
