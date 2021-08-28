require("dotenv").config();

// moment.js configuration
const moment = require("moment");
moment().format();

// Discord configuration
const { Client, Intents } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

// Firestore configuration
const admin = require("firebase-admin");
const serviceAccount = require("./firebase_auth/js-reminder-bot-firebase-adminsdk-6tee5-c742b07f9a.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = { moment, client, admin };
