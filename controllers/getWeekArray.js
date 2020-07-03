const moment = require("moment-timezone");
const timeZoneName = "Europe/Warsaw";
const timeZone = moment.tz.zone(timeZoneName);

// \/ SOME GENERAL RULES \/
const blockFractionOfHour = 0.5;
// /\ SOME GENERAL RULES /\

// \/ FUNCTIONS FOR WEEK \/
const isWeekOutOfRange = (date) => {
  const dateMin = moment.utc();
  const dateMax = moment.utc().add(1, "month").endOf("month");

  const weeksFirstDay = date.clone().startOf("isoWeek");
  const weeksLastDay = date.clone().endOf("isoWeek");
  const res = weeksLastDay.isBefore(dateMin) || weeksFirstDay.isAfter(dateMax);
  return res;
};

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

const getHoursFromMeetings = (date, meetings) => {
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

const generateHours = (
  date,
  meetingDuration,
  generalRuleLocalTime,
  ruleOverrides,
  meetings
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
  const hours = hoursCandidate.filter((hour, i) => {
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
    let hours;
    if (
      (moment
        .utc()
        .add(limitingHourHowManyDaysBefore, "day")
        .isSame(day.utc(), "day") &&
        moment.tz(timeZoneName).hour() >= limitingHourLocalTime) ||
      day.utc().isAfter(moment.utc().add(1, "month").endOf("month"), "day") ||
      day.utc().isBefore(moment.utc())
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

const validateInputDate = (
  dateInitial,
  date,
  meetingDuration,
  limitingHourHowManyDaysBefore,
  limitingHourLocalTime,
  generalRuleLocalTime,
  ruleOverrides,
  meetings
) => {
  if (isWeekOutOfRange(date)) {
    console.log(
      "Szukany tydzień poza zasięgiem. Próba wygenerowania tygodnia dla tygodnia z datą z zapytania"
      // !! dawać parametr, że jest poza zasięgiem i nie można dalej rezerwować HINT (jeśli front end dostanie json z tym hintem to wyświetli odpowiedni komunikat)
    );

    if (isWeekOutOfRange(dateInitial)) {
      console.log(
        "Tydzień z zapytania poza zasięgiem, czyli błędny. Zwracam aktualny tydzień, bez sprawdzania wcześniejszych/późniejszych terminów"
      );
      return generateWeekArray(
        moment.utc(),
        meetingDuration,
        limitingHourHowManyDaysBefore,
        limitingHourLocalTime,
        generalRuleLocalTime,
        ruleOverrides,
        meetings
      );
    } else {
      return generateWeekArray(
        dateInitial,
        meetingDuration,
        limitingHourHowManyDaysBefore,
        limitingHourLocalTime,
        generalRuleLocalTime,
        ruleOverrides,
        meetings
      );
    }
  } else {
    return false;
  }
};

const checkWeekArray = (weekArray) => {
  const hasAnySlots = weekArray.findIndex((item) => item.hours.length > 0);

  return hasAnySlots === -1 ? false : true;
};

const jumpWeek = (date, back) => {
  back ? date.subtract(1, "week") : date.add(1, "week");
};
// /\ FUNCTIONS FOR getWeekArray /\

const getWeekArray = (
  mode,
  meetingDuration,
  dateQuery,
  rules,
  ruleOverrides,
  meetings
) => {
  const dateInitial = moment.utc(dateQuery);
  console.log("dateInitial:", dateInitial);

  const date = dateInitial.clone();

  let back = false;

  switch (mode) {
    case "before":
      back = true;
      jumpWeek(date, back);
      break;
    case "after":
      back = false;
      jumpWeek(date, back);
      break;
    case "asap":
      back = false;
      break;
  }

  console.log("back:", back);
  console.log("generate week that includes:", date);

  const {
    generalRuleLocalTime,
    limitingHourHowManyDaysBefore,
    limitingHourLocalTime,
  } = rules;

  const resultOutOfRange = validateInputDate(
    dateInitial,
    date,
    meetingDuration,
    limitingHourHowManyDaysBefore,
    limitingHourLocalTime,
    generalRuleLocalTime,
    ruleOverrides,
    meetings
  );

  if (resultOutOfRange) {
    return resultOutOfRange;
  }

  console.log("Szukany tydzień jest w zasięgu. Próba wygenerowania tygodnia");

  while (!isWeekOutOfRange(date)) {
    arrayCandidate = generateWeekArray(
      date,
      meetingDuration,
      limitingHourHowManyDaysBefore,
      limitingHourLocalTime,
      generalRuleLocalTime,
      ruleOverrides,
      meetings
    );

    if (checkWeekArray(arrayCandidate)) {
      console.log(`TYDZIEŃ Z DATĄ ${date} ZAWIERA WOLNY TERMIN!!!`);

      return arrayCandidate;
    }
    jumpWeek(date, back);
  }

  console.log(
    `Nie udało się znaleźć terminu patrząc do ${
      back ? "tyłu" : "przodu"
    }. Wygenerowano aktualne dane dla tygodnia zawierającego datę z zapytania.`
  );

  return generateWeekArray(
    dateInitial,
    meetingDuration,
    limitingHourHowManyDaysBefore,
    limitingHourLocalTime,
    generalRuleLocalTime,
    ruleOverrides,
    meetings
  );
};

module.exports = getWeekArray;
