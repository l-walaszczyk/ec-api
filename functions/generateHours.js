const getUTCHoursFromRule = require("./getUTCHoursFromRule");
const getHoursFromMeetings = require("./getHoursFromMeetings");
const { blockFractionOfHour } = require("../config/config");

const generateHours = (
  date,
  meetingDuration,
  generalRuleLocalTime,
  ruleOverrides,
  meetings,
  allBlocks = false
) => {
  const hoursFromRule = getUTCHoursFromRule(
    date,
    generalRuleLocalTime,
    ruleOverrides
  );
  const hoursFromMeetings = getHoursFromMeetings(date, meetings);
  const hoursCandidate = hoursFromRule.filter(
    (hour) => !hoursFromMeetings.includes(hour)
  );
  const hours = allBlocks
    ? hoursCandidate
    : hoursCandidate.filter((hour, i) => {
        const durationHours =
          Math.ceil(meetingDuration / (60 * blockFractionOfHour)) *
          blockFractionOfHour;

        const numberOfBlocks = durationHours / blockFractionOfHour;

        for (let index = 1; index < numberOfBlocks; index++) {
          if (
            hoursCandidate[i + index] !==
            hoursCandidate[i] + index * blockFractionOfHour
          ) {
            return false;
          }
        }
        return true;
      });

  return hours;
};

module.exports = generateHours;
