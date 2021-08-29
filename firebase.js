const config = require("./config");
const { Timestamp } = require("@google-cloud/firestore");

function addReminder(reminder, db = null) {
  if (!db) db = config.admin.firestore();
  var docRef = db.collection("reminders").doc(reminder.title);
  docRef.set(reminder);
  return;
}

async function checkForReminders(db = null) {
  if (!db) db = config.admin.firestore();
  const channel = config.client.channels.cache.get("829052528901357581");
  let date = new Date();
  date.setSeconds(0);
  date.setMilliseconds(0);

  console.log("Checking for reminders");
  const reminders = await db.collection("reminders").get();
  if (!reminders.empty) {
    reminders.forEach((reminder) => {
      if (reminder.data().showtime.toDate().getTime() == date.getTime()) {
        channel.send(`${reminder.data().title}: ${reminder.data().link}`);
      }
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
