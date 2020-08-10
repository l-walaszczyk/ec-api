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

  let transferLabel = `${firstNameContact} ${lastNameContact}`;

  if (transferLabel.length > 20) {
    transferLabel = `${firstNameContact[0]}. ${lastNameContact}`;
  }
  if (transferLabel.length > 20) {
    transferLabel = lastNameContact;
  }
  if (transferLabel.length > 20) {
    transferLabel = transferLabel.slice(0, 19);
  }

  console.log(transferLabel);

  const params = {
    id,
  };

  const paymentParam = {
    p24_amount: meetingPrice * 100, // 100.00PLN -> 10000
    p24_country: "PL",
    p24_currency: "PLN",
    p24_description: meetingName,
    p24_email: emailContact,
    p24_session_id: id,
    p24_url_return: urlUI + "/umow-spotkanie?" + new URLSearchParams(params),
    p24_url_status: urlAPI + "/p24status", //?" + new URLSearchParams(params),
    p24_transfer_label: transferLabel,
    p24_encoding: "UTF-8",
    p24_name_1: meetingName,
    p24_quantity_1: 1,
    p24_price_1: meetingPrice,
  };

  console.log(p24_url_status);

  const trnRequestURL = await p24.getPaymentLink(new Payment(paymentParam));

  console.log(trnRequestURL);

  return trnRequestURL;
};

module.exports = przelewy24;
