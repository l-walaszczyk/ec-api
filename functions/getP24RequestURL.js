const { Payment } = require("@ingameltd/node-przelewy24");

const getP24RequestURL = async (
  p24,
  urlUI,
  urlAPI,
  id,
  {
    meetingName,
    meetingPrice,
    meetingDetails: { firstNameContact, lastNameContact, emailContact },
  }
) => {
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
    p24_time_limit: 20,
    p24_wait_for_result: 1,
    // p24_name_1: meetingName,
    // p24_quantity_1: 1,
    // p24_price_1: meetingPrice,
  };

  const trnRequestURL = await p24.getPaymentLink(new Payment(paymentParam));

  console.log(trnRequestURL);

  return trnRequestURL;
};

module.exports = getP24RequestURL;
