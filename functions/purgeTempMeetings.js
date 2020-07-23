const Meetings = require("../models/meetings");
const { purgeTempMeetingsOlderThan } = require("../config/config");
const moment = require("moment");

const purgeTempMeetings = async () => {
  const creationDateMin = moment
    .utc()
    .subtract(purgeTempMeetingsOlderThan, "minutes")
    .toDate();

  const meetingsSearchParams = {
    $and: [{ status: "temp" }, { creationDate: { $lt: creationDateMin } }],
  };

  const res = await Meetings.deleteMany(meetingsSearchParams);

  if (!res.ok) {
    return "Error while purging temp meetings:" + err;
  }
  return `Successfully purged ${res.n} meetings.`;
};

module.exports = purgeTempMeetings;
