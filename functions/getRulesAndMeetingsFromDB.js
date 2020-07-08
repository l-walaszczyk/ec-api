const moment = require("moment");
const Rules = require("../models/rules");
const Overrides = require("../models/overrides");
const Meetings = require("../models/meetings");
const { purgeTempMeetingsOlderThan } = require("../config/config");

const getRulesAndMeetingsFromDB = async (
  dateMin,
  dateMax,
  savedMeeting,
  id
) => {
  const creationDateMin = moment
    .utc()
    .subtract(purgeTempMeetingsOlderThan, "minutes")
    .toDate();

  const meetingsSearchParams = {
    meetingDate: {
      $gte: dateMin,
      $lte: dateMax,
    },
    $or: [
      { status: { $ne: "temp" } },
      {
        $and: [{ status: "temp" }, { creationDate: { $gte: creationDateMin } }],
      },
    ],
  };

  const ids = [];

  if (savedMeeting) {
    meetingsSearchParams.creationDate = { $lte: savedMeeting.creationDate };
    ids.push(savedMeeting._id);
  }

  if (id) {
    ids.push(id);
  }

  if (ids.length) {
    meetingsSearchParams._id = { $nin: [...ids] };
  }

  const promises = [
    Rules.findOne({}, (err, rules) => {
      if (err) {
        return console.log("Error while importing Rules from db: ", err);
      }
      return rules;
    }),
    Overrides.find(
      {
        day: {
          $gte: dateMin,
          $lte: dateMax,
        },
      },
      (err, ruleOverrides) => {
        if (err) {
          return console.log("Error while importing Overrides from db: ", err);
        }
        return ruleOverrides;
      }
    ),
    Meetings.find(meetingsSearchParams, (err, meetings) => {
      if (err) {
        return console.log("Error while importing Meetings from db: ", err);
      }
      return meetings;
    }),
  ];

  // const [rules, ruleOverrides, meetings] = await Promise.all(promises);
  return await Promise.all(promises);
};

module.exports = getRulesAndMeetingsFromDB;
