const jumpWeek = (date, back) => {
  back ? date.subtract(1, "week") : date.add(1, "week");
};

module.exports = jumpWeek;
