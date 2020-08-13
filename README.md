# ec-api

### Back-end part of the "ec" project

The "ec" project is a Single Page Application created for a psychologist Emilia Cwojdzińska. It was designed to provide the Emilia's customers with information about her areas of expertise, services she offers and - most importantly - a way to book an apointment online and pay for it in advance.

## Technologies, frameworks and libraries used on the back end

- node.js
- express
- mongodb
- mongoose (to enforce data validation before saving to mongodb)
- moment (extended with moment-timezone - to stick to Emilia's local time regardless of the customer's timezone)
- dotenv (to use environmental variables locally)
- nodemailer (to send automatic email notifications to Emilia and her customers when an appointment is booked)
- [@ingameltd/node-przelewy24](https://github.com/ingameltd/node-przelewy24#readme) (to implement Przelewy24 online payments)

## Setup

These instructions will get you a copy of the project up and running on your local machine.

### Prerequisites

You need to have access to a MongoDB database. I recommend trying [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for free. Please follow instructions on the MongoDB website.

You also need to have a transactional email provider account. I recommend trying [Sendinblue](https://www.sendinblue.com/)

**It is important that you change the text of the confirmation email so that you do not impersonate and misrepresent Emilia and her practition.** To do that, modify the object (specifically, its `html` property) that is an input to `transporter.sendMail` method which is located in `ec-ui/functions/emailSender.js`. The contents of the confirmation email are within template literals, in the area of lines 50-120.

Once you have the abovementioned services activated you have to create a file named `.env` in the main ec-api directory and paste the following code (filled with data of your accounts):

```
DB_URL=mongodb+srv://admin:<password>@<cluster-name>-icadi.mongodb.net/<dbname>?retryWrites=true&w=majority
EMAIL_ALIAS=Your Name<info@your-transactional-email-domain.com>
EMAIL_BCC=your@email.com
EMAIL_PASS=your-transactional-email-provider-account-password
EMAIL_REPLYTO=your@email.com
EMAIL_USER=your-transactional-email-provider-account-username
P24_CRC=przelewy24-crc-code
P24_ID=przelewy24-merchant-id
P24_TEST=true
```

### Installing and running

To run this project, install it locally using npm:

```
$ npm install
$ npm run start
```

## Link to front-end part of the "ec" project

[ec-api](https://github.com/l-walaszczyk/ec-ui)

## Link to the website (specifically to the appointment scheduler)

[emiliacwojdzinska.pl/umow-spotkanie](https://emiliacwojdzinska.pl/umow-spotkanie)
