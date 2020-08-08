// "use strict";
require("dotenv").config();
const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
require("moment/locale/pl");
// const fs = require("fs");

const emailSender = async ({
  meetingDate,
  meetingName,
  meetingPrice,
  meetingDuration,
  selectedFieldIndex,
  numberOfPeople,
  meetingDetails: {
    forSomeoneElse = undefined,
    firstNameContact,
    lastNameContact,
    firstName2,
    lastName2,
    yearOfBirth2,
    emailContact,
    phoneContact,
    paymentMethod,
  },
}) => {
  const meetingDateLocal = moment.utc(meetingDate).tz("Europe/Warsaw");

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

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: process.env.EMAIL_ALIAS,
    to: emailContact,
    bcc: process.env.EMAIL_BCC,
    replyTo: process.env.EMAIL_REPLYTO,
    subject: "Potwierdzenie zapisanej wizyty",
    html: `<p>Poniższa wiadomość została wygenerowana automatycznie.</p>

           <p>Dziękuję za umówienie wizyty w moim gabinecie.<br>
           Proszę sprawdzić poprawność zapisanych danych, w razie potrzeby proszę oodpowiedzieć mailowo na tę wiadomość i podać porawione dane.</p>

           <h3>Podsumowanie:</h3>
           <ul>
           ${
             firstName2
               ? `<li>Zapisani pacjenci: ${firstNameContact} i ${firstName2}</li>`
               : `<li>Zapisany pacjent: ${firstNameContact}</li>`
           }
           ${
             forSomeoneElse
               ? `<li>Osoba kontaktowa: ${firstNameContact}, tel.: ${phoneContact}</li>`
               : `<li>Numer telefonu: ${phoneContact}</li>`
           }
           <li>Rodzaj spotkania: ${meetingName}</li>
           <li>Data: ${meetingDateLocal.format("dddd, D MMMM YYYY")}</li>
           <li>Godzina: ${meetingDateLocal.format("HH:mm")}</li>
           <li>Czas trwania: do ${meetingDuration} minut</li>
           <li>Koszt: ${meetingPrice} zł (do opłacenia podczas wizyty)</li>
           </ul>
          
           ${
             meetingName.includes("dziec")
               ? `<p>Przed pierwszą wizytą proszę o uzupełnienie kwestionariusza, znajdującego się
             w materiałach do pobrania na mojej stronie i przesłanie go do mnie za pośrednictwem poczty e-mail lub dostarczenie osobiście podczas wizyty w gabinecie.</p>

             <p>Linki do pobrania kwestionariusza:</p>
             <ul>
             <li><a href="https://emiliacwojdzinska.pl/docs/Kwestionariusz%20dzieci%20pytania.doc">plik w formacie .doc (jeśli wypełniamy na komputerze)</a></li>
             <li><a href="https://emiliacwojdzinska.pl/docs/Kwestionariusz%20dzieci%20pytania.pdf">plik w formacie .pdf (jeśli drukujemy i wypełniamy ręcznie)</a></li>
             </ul>`
               : ``
           }

           <p>W trosce o anonimowość klientów, uprzejmie proszę o przybycie nie  wcześniej niż o ustalonej godzinie.</p>

           <p>W razie konieczności przełożenia terminu wizyty proszę o kontakt.</p>
          
           <p>Pozdrawiam serdecznie i do zobaczenia,<br>
           Emilia Cwojdzińska<br>
           ul. T. Kościuszki 2, 66-110 Babimost<br>
           tel. <a href="tel:600044618">600 044 618</a><br>
           <a href="https://www.emiliacwojdzinska.pl">www.emiliacwojdzinska.pl</a></p>`,
  });

  console.log("Message sent: %s", info.messageId);
  return info.messageId;
};
module.exports = emailSender;
