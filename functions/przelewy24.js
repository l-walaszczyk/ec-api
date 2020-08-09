const {
  Przelewy24,
  Payment,
  // PaymentOptions,
  // ShoppingDetail,
  // TransactionVerification,
} = require("@ingameltd/node-przelewy24");
require("dotenv").config();
// const {
//   allowedOrigins: [urlUI],
// } = require("../config/config");

const przelewy24 = async (
  urlUI,
  urlAPI,
  id,
  {
    meetingName,
    meetingPrice,
    meetingDetails: { firstNameContact, lastNameContact, emailContact },
  }
) => {
  const MERCHANT_ID = process.env.P24_ID;
  const POS_ID = MERCHANT_ID;
  const SALT = process.env.P24_CRC;
  const TEST_MODE = true;

  const p24 = new Przelewy24(MERCHANT_ID, POS_ID, SALT, TEST_MODE);

  const connTestResult = await p24.testConnection();
  console.log(connTestResult ? "P24 connection ok" : "P24 connection failed");

  const firstName = firstNameContact;
  const lastName = lastNameContact;

  const params = {
    id,
  };

  const paymentParam = {
    p24_amount: meetingPrice * 100, // 100.00PLN -> 10000
    p24_country: "PL", // set country codes
    p24_currency: "PLN", // set currency
    p24_description: meetingName, // set description
    p24_email: emailContact, // customer's email
    p24_session_id: id, // a unique id from merchant's system
    p24_url_return: urlUI + "/umow-spotkanie?" + new URLSearchParams(params), // return user to following url after a valid transaction
    p24_url_status: urlAPI + "/p24status", //?" + new URLSearchParams(params),
    p24_transfer_label: `${firstName} ${lastName}`,
    p24_encoding: "UTF-8",
    p24_name_1: meetingName,
    p24_quantity_1: 1,
    p24_price_1: meetingPrice,
  };

  const trnRequestURL = await p24.getPaymentLink(new Payment(paymentParam));
  console.log(trnRequestURL);
  return trnRequestURL;
};

module.exports = przelewy24;
