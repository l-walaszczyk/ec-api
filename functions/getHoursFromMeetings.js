const moment = require("moment-timezone");
const { blockFractionOfHour } = require("../config/config");

const getHoursFromMeetings = (date, meetings) => {
  // meetings = typeof meetings === Array ? meetings : [meetings];

  const meetingsOnDate = meetings.filter((meeting) =>
    date.isSame(meeting.meetingDate, "day")
  );

  const hours = [];

  for (const { meetingDate, meetingDuration } of meetingsOnDate) {
    const startHour =
      moment.utc(meetingDate).get("hour") +
      Math.round(
        moment.utc(meetingDate).get("minutes") / (60 * blockFractionOfHour)
      ) *
        blockFractionOfHour;

    const durationHours =
      Math.ceil(meetingDuration / (60 * blockFractionOfHour)) *
      blockFractionOfHour;

    const numberOfBlocks = durationHours / blockFractionOfHour;

    for (let index = 0; index < numberOfBlocks; index++) {
      const hour = startHour + index * blockFractionOfHour;
      hours.push(hour);
    }
  }

  return hours;
};

module.exports = getHoursFromMeetings;
