require("dotenv").config();
const nodemailer = require("nodemailer");
const moment = require("moment-timezone");
require("moment/locale/pl");

const emailSender = async ({
  status,
  meetingDate,
  meetingName,
  meetingPrice,
  meetingDuration,
  selectedFieldIndex,
  meetingDetails: {
    firstNameContact,
    lastNameContact,
    firstName2,
    lastName2,
    firstName3,
    lastName3,
    emailContact,
    phoneContact,
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
    subject: `Potwierdzenie ${
      status === "paid" ? "opłaconej" : "zapisanej"
    } wizyty`,
    html: `

           <p>Dziękuję za umówienie wizyty ${
             meetingName.includes("Skype") ? "online" : "w moim gabinecie"
           }${status === "paid" ? " i dokonanie płatności." : "."}</p>
           
           <p>Proszę sprawdzić poprawność zapisanych danych, w razie potrzeby proszę odpowiedzieć mailowo na tę wiadomość i podać poprawione dane.</p>

           <h3>Podsumowanie:</h3>
           <ul>
           ${
             selectedFieldIndex === 1
               ? `<li>Zapisane dziecko/nastolatek: ${firstName2} ${lastName2}</li>
               <li>Rodzic/opiekun: ${firstNameContact} ${lastNameContact}</li>`
               : firstName3
               ? `<li>Zapisane osoby: ${firstNameContact} ${lastNameContact}, ${firstName2} ${lastName2} i ${firstName3} ${lastName3}</li>`
               : firstName2
               ? `<li>Zapisane osoby: ${
                   (selectedFieldIndex === 0) & (lastNameContact === lastName2)
                     ? `${firstNameContact} i ${firstName2} ${lastNameContact}`
                     : `${firstNameContact} ${lastNameContact} i ${firstName2} ${lastName2}`
                 }</li>`
               : `<li>Zapisana osoba: ${firstNameContact} ${lastNameContact}</li>`
           }
           <li>Numer telefonu: ${phoneContact}</li>
           <li>Rodzaj spotkania: ${meetingName}</li>
           <li>Data: ${meetingDateLocal.format("dddd, D MMMM YYYY")}</li>
           <li>Godzina: ${meetingDateLocal.format("HH:mm")}</li>
           <li>Czas trwania: do ${meetingDuration} minut</li>
           <li>Koszt: ${meetingPrice} zł (${
      status === "paid" ? "już zapłacone" : "do opłacenia podczas wizyty"
    })</li>
           </ul>
          
           ${
             selectedFieldIndex === 1
               ? `<p>Przed pierwszą wizytą proszę o uzupełnienie zgody rodzica/opiekuna na wizytę dziecka/nastolatka (linki do pobrania poniżej) i przesłanie jej do mnie za pośrednictwem poczty e-mail${
                   meetingName.includes("Skype")
                     ? "."
                     : " lub dostarczenie osobiście podczas wizyty w gabinecie."
                 }</p>

             <p>Linki do pobrania zgody rodzica/opiekuna:</p>
             <ul>
             <li><a href="https://emiliacwojdzinska.pl/docs/Zgoda%20opiekuna.doc">plik w formacie .doc (jeśli wypełniamy na komputerze)</a></li>
             <li><a href="https://emiliacwojdzinska.pl/docs/Zgoda%20opiekuna.pdf">plik w formacie .pdf (jeśli drukujemy i wypełniamy ręcznie)</a></li>
             </ul>`
               : ""
           }

           ${
             meetingName.includes("Skype")
               ? `<p>Aby znaleźć mnie na Skype, proszę wyszukać w oknie programu: <i>${process.env.SKYPE}</i></p>`
               : "<p>W trosce o anonimowość klientów, uprzejmie proszę o przybycie nie  wcześniej niż o ustalonej godzinie.</p>"
           }
           
           <p>W razie konieczności przełożenia terminu wizyty proszę o kontakt.</p>
          
           <p>Pozdrawiam serdecznie i do zobaczenia,<br>
           Emilia Cwojdzińska<br>
           ul. T. Kościuszki 2, 66-110 Babimost<br>
           tel. <a href="tel:600044618">600 044 618</a><br>
           <a href="https://www.emiliacwojdzinska.pl">www.emiliacwojdzinska.pl</a></p>
           
           <p>Powyższa wiadomość została wygenerowana automatycznie.</p>`,
  });

  console.log("Message sent: %s", info.messageId);
  return info.messageId;
};
module.exports = emailSender;
