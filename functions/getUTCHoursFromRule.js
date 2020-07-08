const moment = require("moment-timezone");
const timeZone = moment.tz.zone("Europe/Warsaw");
const { blockFractionOfHour } = require("../config/config");

const getUTCHoursFromRule = (date, generalRuleLocalTime, ruleOverrides) => {
  const ruleOverride = ruleOverrides.find((override) =>
    date.isSame(override.day, "day")
  );
  const slotsLocalTime = ruleOverride
    ? ruleOverride.slotsLocalTime
    : generalRuleLocalTime[date.clone().get("isoWeekday") - 1];

  const timeOffset = timeZone.parse(date);
  const timeOffsetHours = timeOffset / 60;

  const hours = [];
  for (const [slotStartLocalTime, slotEndLocalTime] of slotsLocalTime) {
    const span = slotEndLocalTime - slotStartLocalTime;
    const numberOfBlocks = Math.floor(span / blockFractionOfHour);

    for (let index = 0; index < numberOfBlocks; index++) {
      const hour =
        slotStartLocalTime + timeOffsetHours + index * blockFractionOfHour;
      hours.push(hour);
    }
  }

  return hours;
};

module.exports = getUTCHoursFromRule;
