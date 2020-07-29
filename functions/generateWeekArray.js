const moment = require("moment-timezone");
const generateHours = require("./generateHours");
const timeZoneName = "Europe/Warsaw";
const timeZone = moment.tz.zone(timeZoneName);

const generateWeekArray = (
  date,
  meetingDuration,
  limitingHourHowManyDaysBefore,
  limitingHourLocalTime,
  generalRuleLocalTime,
  ruleOverrides,
  meetings
) => {
  const timeOffset = timeZone.parse(date);
  const timeOffsetHours = timeOffset / 60;

  const weeksFirstDay = date.clone().startOf("isoWeek");

  const weekArray = [];

  for (let index = 0; index <= 6; index++) {
    const day = weeksFirstDay.clone().add(index, "day");

    let hours;
    if (
      (moment
        .utc()
        .subtract(timeOffsetHours, "hour")
        .add(limitingHourHowManyDaysBefore, "day")
        .isSame(day.utc(), "day") &&
        moment.tz(timeZoneName).hour() >= limitingHourLocalTime) ||
      day
        .utc()
        .isAfter(
          moment
            .utc()
            .subtract(timeOffsetHours, "hour")
            .add(1, "month")
            .endOf("month"),
          "day"
        ) ||
      day.utc().isBefore(moment.utc().subtract(timeOffsetHours, "hour"))
    ) {
      hours = [];
    } else {
      hours = generateHours(
        day,
        meetingDuration,
        generalRuleLocalTime,
        ruleOverrides,
        meetings
      );
    }
    weekArray[index] = { day: day.format(), hours };
  }
  return weekArray;
};

module.exports = generateWeekArray;
