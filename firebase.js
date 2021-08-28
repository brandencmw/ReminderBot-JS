const config = require("./config");

function addReminder(reminder, db = null) {
  if (!db) db = config.admin.firestore();
  var docRef = db.collection("reminders").doc(reminder.title);
  docRef.set(reminder);
  return;
}

async function checkForReminders(db = null) {
  if (!db) db = config.admin.firestore();
  const channel = config.client.channels.cache("829052528901357581");
  console.log("Checking for reminders");
  const currentTime = new Date();
  currentTime.setSeconds(0);
  const reminders = await db
    .collection("reminders")
    .where("showtime", "==", currentTime)
    .get();
  if (!reminders.empty) {
    reminders.forEach((reminder) => {
      config.channel.send(`$[{reminder.title}](${reminder.link})`);
    });
  }
}

function removeReminder(reminder, db = null) {
  if (!db) db = config.admin.firestore();
  const result = db.collection("reminders").doc(reminder.title).delete();
  return;
}

module.exports = {
  addReminder,
  checkForReminders,
  removeReminder,
};
