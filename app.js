const express = require("express");
const moment = require("moment");
const config = require("./config");
const mongoose = require("mongoose");
const Rules = require("./models/rules");
const Overrides = require("./models/overrides");
const Meetings = require("./models/meetings");

// \/ SOME GENERAL RULES \/

const blockFractionOfHour = 0.5;

// /\ SOME GENERAL RULES /\

// \/ CONNECTION WITH DATABASE \/

mongoose.connect(config.db, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

// /\ CONNECTION WITH DATABASE /\

// \/ SERVER LISTEN \/

const port = process.env.PORT || 3001;

const app = express();

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

// /\ SERVER LISTEN /\

// \/ FUNCTIONS FOR SCHEDULER \/

const isWeekOutOfRange = (date) => {
  const dateMin = moment.utc();
  const dateMax = moment.utc().add(1, "month").endOf("month");

  const weeksFirstDay = date.clone().startOf("isoWeek");
  const weeksLastDay = date.clone().endOf("isoWeek");
  const res = weeksLastDay.isBefore(dateMin) || weeksFirstDay.isAfter(dateMax);
  return res;
};

const getHoursFromRule = (date, generalRule, ruleOverrides) => {
  const ruleOverride = ruleOverrides.find((override) =>
    date.isSame(override.day, "day")
  );
  const slots = ruleOverride
    ? ruleOverride.slots
    : generalRule[date.clone().get("isoWeekday") - 1];
  console.log(slots);

  const hours = [];
  for (const [slotStart, slotEnd] of slots) {
    const span = slotEnd - slotStart;
    const numberOfBlocks = Math.floor(span / blockFractionOfHour);

    for (let index = 0; index < numberOfBlocks; index++) {
      const hour = slotStart + index * blockFractionOfHour;
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
  generalRule,
  ruleOverrides,
  meetings
) => {
  const hoursFromRule = getHoursFromRule(date, generalRule, ruleOverrides);
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
  limitingUTCHour,
  generalRule,
  ruleOverrides,
  meetings
) => {
  const weeksFirstDay = date.clone().startOf("isoWeek");
  const weekArray = [];
  for (let index = 0; index <= 6; index++) {
    const day = weeksFirstDay.clone().add(index, "day");
    let hours;
    if (
      (moment.utc().isSame(day.utc(), "day") &&
        moment.utc().hour() >= limitingUTCHour) ||
      moment.utc().isAfter(day.utc(), "day")
    ) {
      hours = [];
    } else {
      hours = generateHours(
        day,
        meetingDuration,
        generalRule,
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
  limitingUTCHour,
  generalRule,
  ruleOverrides,
  meetings
) => {
  if (isWeekOutOfRange(date)) {
    console.log(
      "Szukany tydzień poza zasięgiem. Próba wygenerowania tygodnia dla tygodnia z datą z zapytania"
    );

    if (isWeekOutOfRange(dateInitial)) {
      console.log(
        "Tydzień z zapytania poza zasięgiem, czyli błędny. Zwracam aktualny tydzień, bez sprawdzania wcześniejszych/późniejszych terminów"
      );
      return generateWeekArray(
        moment.utc(),
        meetingDuration,
        limitingUTCHour,
        generalRule,
        ruleOverrides,
        meetings
      );
    } else {
      return generateWeekArray(
        dateInitial,
        meetingDuration,
        limitingUTCHour,
        generalRule,
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

const returnTheRightArray = (
  dateInitial,
  date,
  meetingDuration,
  back,
  limitingUTCHour,
  generalRule,
  ruleOverrides,
  meetings
) => {
  const resultOutOfRange = validateInputDate(
    dateInitial,
    date,
    meetingDuration,
    limitingUTCHour,
    generalRule,
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
      limitingUTCHour,
      generalRule,
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
    limitingUTCHour,
    generalRule,
    ruleOverrides,
    meetings
  );
};

// /\ FUNCTIONS FOR SCHEDULER /\

// \/ SCHEDULER \/

app.get("/:mode/", async (req, res) => {
  const { mode } = req.params;
  console.log(mode);

  const { meetingDuration, date: dateQuery } = req.query;
  console.log("meetingDuration:", meetingDuration, "minutes");
  console.log("dateQuery:", dateQuery);

  const dateInitial = moment.utc(dateQuery);
  console.log("dateInitial:", dateInitial);

  const date = dateInitial.clone().minute(0).second(0).millisecond(0);

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

  // \/ GETTING DATA FROM DB \/
  const rules = await Rules.findOne({}, (err, rules) => {
    if (err) {
      res.status(404).send("Database error");
      return console.log("Error while importing Rules from db: ", err);
    }
    return rules;
  });

  const { generalRule, limitingUTCHour } = rules;

  const ruleOverrides = await Overrides.find(
    {
      day: {
        $gte: moment.utc().toDate(),
        $lte: moment.utc().add(1, "month").endOf("month").toDate(),
      },
    },
    (err, ruleOverrides) => {
      if (err) {
        res.status(404).send("Database error");
        return console.log("Error while importing Overrides from db: ", err);
      }
      return ruleOverrides;
    }
  );

  const meetings = await Meetings.find(
    {
      meetingDate: {
        $gte: moment.utc().toDate(),
        $lte: moment.utc().add(1, "month").endOf("month").toDate(),
      },
    },
    (err, meetings) => {
      if (err) {
        res.status(404).send("Database error");
        return console.log("Error while importing Meetings from db: ", err);
      }
      return meetings;
    }
  );
  // /\ GETTING DATA FROM DB /\

  const array = returnTheRightArray(
    dateInitial,
    date,
    meetingDuration,
    limitingUTCHour,
    back,
    generalRule,
    ruleOverrides,
    meetings
  );
  console.log(array);

  res.json(array);
});

// /\ SCHEDULER /\
