const moment = require("moment-timezone");
const generateHours = require("./generateHours");
const timeZoneName = "Europe/Warsaw";
// const timeZone = moment.tz.zone(timeZoneName);

const generateWeekArray = (
  date,
  meetingDuration,
  limitingHourHowManyDaysBefore,
  limitingHourLocalTime,
  generalRuleLocalTime,
  ruleOverrides,
  meetings
) => {
  const weeksFirstDay = date.clone().startOf("isoWeek");
  const weekArray = [];
  for (let index = 0; index <= 6; index++) {
    const day = weeksFirstDay.clone().add(index, "day");
    const dayLocalTime = day.clone().tz(timeZoneName).startOf("day");
    const nowLocalTime = moment.tz(timeZoneName);
    let hours;
    if (
      (nowLocalTime
        .add(limitingHourHowManyDaysBefore, "day")
        .isSame(dayLocalTime, "day") &&
        nowLocalTime.hour() >= limitingHourLocalTime) ||
      dayLocalTime.isAfter(
        nowLocalTime.add(1, "month").endOf("month"),
        "day"
      ) ||
      dayLocalTime.isBefore(nowLocalTime)
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
