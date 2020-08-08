const moment = require("moment-timezone");
const validateInputDate = require("./validateInputDate");
const isWeekOutOfRange = require("./isWeekOutOfRange");
const generateWeekArray = require("./generateWeekArray");
const checkWeekArray = require("./checkWeekArray");
const jumpWeek = require("./jumpWeek");
const getRulesAndMeetingsFromDB = require("./getRulesAndMeetingsFromDB");

const getWeekArray = async (direction, meetingDuration, dateQuery, id) => {
  // \/ GETTING DATA FROM DB \/
  const [rules, ruleOverrides, meetings] = await getRulesAndMeetingsFromDB(
    moment.utc().toDate(),
    moment.utc().add(1, "month").endOf("month").toDate(),
    false,
    id
  );
  // /\ GETTING DATA FROM DB /\

  const dateInitial = moment.utc(dateQuery);
  // console.log("dateInitial:", dateInitial);

  const date = dateInitial.clone();

  let back = false;

  switch (direction) {
    case "before":
      back = true;
      jumpWeek(date, back);
      break;
    case "after":
      back = false;
      jumpWeek(date, back);
      break;
    default:
      back = false;
      break;
  }

  // console.log("back:", back);
  // console.log("generate week that includes:", date);

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

  // console.log("Szukany tydzień jest w zasięgu. Próba wygenerowania tygodnia");

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
      return [arrayCandidate, true];
    }
    jumpWeek(date, back);
  }

  console.log(
    `Nie udało się znaleźć terminu patrząc do ${
      back ? "tyłu" : "przodu"
    }. Wygenerowano aktualne dane dla tygodnia zawierającego datę z zapytania.`
  );

  return [
    generateWeekArray(
      dateInitial,
      meetingDuration,
      limitingHourHowManyDaysBefore,
      limitingHourLocalTime,
      generalRuleLocalTime,
      ruleOverrides,
      meetings
    ),
    false,
  ];
};

module.exports = getWeekArray;
