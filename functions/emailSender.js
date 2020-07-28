// "use strict";
require("dotenv").config();
const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
require("moment/locale/pl");
// const fs = require("fs");

const emailSender = async (meeting) => {
  const meetingDateLocal = moment.utc(meeting.meetingDate).tz("Europe/Warsaw");

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: "SendinBlue",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // verify connection configuration
  const verification = await transporter.verify();
  console.log(verification && "email account ready");

  const randomKey = Math.random();

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: process.env.EMAIL_ALIAS,
    to: meeting.meetingDetails.email,
    bcc: process.env.EMAIL_BCC,
    replyTo: process.env.EMAIL_REPLYTO,
    subject: "Potwierdzenie zapisanej wizyty",
    // html: `<img src="cid:${randomKey}@emiliacwojdzinska.pl"/>
    html: `<p>Poniższa wiadomość została wygenerowana automatycznie.</p>

           <p>Dziękuję za umówienie wizyty w moim gabinecie.</p>

           <h3>Podsumowanie:</h3>
           <ul>
           <li>Rodzaj spotkania: ${meeting.meetingDetails.meetingType.name}</li>
           <li>Data: ${meetingDateLocal.format("dddd, D MMMM YYYY")}</li>
           <li>Godzina: ${meetingDateLocal.format("HH:mm")}</li>
           <li>Czas trwania: do ${
             meeting.meetingDetails.meetingType.minutes
           } minut</li>
           <li>Koszt: ${
             meeting.meetingDetails.meetingType.price
           } zł (do opłacenia podczas wizyty)</li>
           </ul>
          
           <p>W ramach przygotowania do wizyty proszę o uzupełnienie kwestionariusza, znajdującego się
           w materiałach do pobrania na mojej stronie i przesłanie go do mnie mailowo lub zabranie ze sobą na spotkanie</p>

           <p>Linki do pobrania kwestionariusza:</p>
           <p><a href="https://emiliacwojdzinska.pl/docs/Kwestionariusz%20dzieci%20pytania.doc">plik w formacie .doc</a> </p>
           <p><a href="https://emiliacwojdzinska.pl/docs/Kwestionariusz%20dzieci%20pytania.pdf">plik w formacie .pdf</a> </p>
                     
           <p>W trosce o anonimowość klientów, uprzejmie proszę o przybycie nie  wcześniej niż o ustalonej godzinie.</p>
          
           <p>Pozdrawiam serdecznie i do zobaczenia,<br>
           Emilia Cwojdzińska</p>`,
    // attachments: [
    //   {
    //     filename: "logo.png",
    //     path: "./assets/images/",
    //     cid: `${randomKey}@emiliacwojdzinska.pl`,
    //   },
    // ],
  });

  console.log("Message sent: %s", info.messageId);
};
module.exports = emailSender;
