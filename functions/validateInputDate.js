const isWeekOutOfRange = require("./isWeekOutOfRange");
const generateWeekArray = require("./generateWeekArray");

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
      return [
        generateWeekArray(
          moment.utc(),
          meetingDuration,
          limitingHourHowManyDaysBefore,
          limitingHourLocalTime,
          generalRuleLocalTime,
          ruleOverrides,
          meetings
        ),
        false,
      ];
    } else {
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
    }
  } else {
    return false;
  }
};

module.exports = validateInputDate;
