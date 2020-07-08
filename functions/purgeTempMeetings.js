const Meetings = require("../models/meetings");
const { purgeTempMeetingsOlderThan } = require("../config/config");
const moment = require("moment");

const purgeTempMeetings = () => {
  const creationDateMin = moment
    .utc()
    .subtract(purgeTempMeetingsOlderThan, "minutes")
    .toDate();

  const meetingsSearchParams = {
    $and: [{ status: "temp" }, { creationDate: { $lt: creationDateMin } }],
  };

  Meetings.deleteMany(meetingsSearchParams, (err, res) => {
    if (err) {
      return console.log("Error while purging temp meetings:", err);
    }
    console.log(`Successfully purged ${res.n} meetings.`);
    setTimeout(purgeTempMeetings, 1000 * 60 * purgeTempMeetingsOlderThan);
  });
};

module.exports = purgeTempMeetings;
