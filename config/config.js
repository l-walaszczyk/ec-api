module.exports = {
  // \/ SOME GENERAL RULES \/
  blockFractionOfHour: 0.5,
  purgeTempMeetingsOlderThan: 30,
  // /\ SOME GENERAL RULES /\
  mongo:
    "mongodb+srv://admin:BVLqqAaAQQvjhqXJ@ec-cluster-icadi.mongodb.net/test?retryWrites=true&w=majority",
  keySession: ["TWOJKLUCZ"],
  maxAgeSession: 60 * 60 * 1000, // 60 minutes
};
