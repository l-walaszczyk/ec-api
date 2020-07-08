const moment = require("moment-timezone");

const isWeekOutOfRange = (date) => {
  const dateMin = moment.utc();
  const dateMax = moment.utc().add(1, "month").endOf("month");

  const weeksFirstDay = date.clone().startOf("isoWeek");
  const weeksLastDay = date.clone().endOf("isoWeek");
  const res = weeksLastDay.isBefore(dateMin) || weeksFirstDay.isAfter(dateMax);
  return res;
};

module.exports = isWeekOutOfRange;
