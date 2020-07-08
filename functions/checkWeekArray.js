const checkWeekArray = (weekArray) => {
  const hasAnySlots = weekArray.findIndex((item) => item.hours.length > 0);

  return hasAnySlots === -1 ? false : true;
};

module.exports = checkWeekArray;
