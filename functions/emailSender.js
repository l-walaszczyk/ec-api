// "use strict";
require("dotenv").config();
const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
require("moment/locale/pl");

const emailSender = async (meeting) => {
  const meetingDateLocal = moment.utc(meeting.meetingDate).tz("Europe/Warsaw");

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "poczta.o2.pl",
    port: 465,
    secure: true, // upgrade later with STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // verify connection configuration
  const verification = await transporter.verify();
  console.log(verification && "email account ready");

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: `Emilia Cwojdzińska - automatyczne powiadomienia<${process.env.EMAIL_ALIAS}>`,
    to: meeting.meetingDetails.email,
    bcc: process.env.EMAIL_BCC,
    replyTo: process.env.EMAIL_REPLYTO,
    subject: "Potwierdzenie zapisanej wizyty",
    text: `Poniższa wiadomość została wygenerowana automatycznie.
Dziękuję za umówienie wizyty w moim gabinecie.

Podsumowanie:
Rodzaj spotkania: ${meeting.meetingDetails.meetingType.name}
Data: ${meetingDateLocal.format("dddd, D MMMM YYYY")}
Godzina: ${meetingDateLocal.format("HH:mm")}
Czas trwania: do ${meeting.meetingDetails.meetingType.minutes} minut
Koszt: ${
      meeting.meetingDetails.meetingType.price
    } zł (do opłacenia podczas wizyty)

W trosce o anonimowość klientów, uprzejmie proszę o przybycie nie  wcześniej niż o ustalonej godzinie.

Pozdrawiam serdecznie i do zobaczenia,
Emilia Cwojdzińska`,
  });

  console.log("Message sent: %s", info.messageId);
};
module.exports = emailSender;
