const config = require("./config");
const { Timestamp } = require("@google-cloud/firestore");

function addReminder(reminder, db = null) {
  var docRef = config.db.collection("reminders").doc(reminder.title);
  docRef.set(reminder);
  return;
}

function updateTimeStamp(reminder) {
  const remReference = config.db.collection("reminders").doc(reminder.title);
  let date = config.moment(reminder.showtime.toDate());
  date = date.add(reminder.intervalLen, reminder.intervalVerb);

  remReference.update({ showtime: date });
}

async function checkForReminders(db = null) {
  const channel = config.client.channels.cache.get("829052528901357581");
  let date = new Date();
  date.setSeconds(0);
  date.setMilliseconds(0);

  console.log("Checking for reminders");
  const reminders = await config.db.collection("reminders").get();
  if (!reminders.empty) {
    reminders.forEach((reminder) => {
      if (reminder.data().showtime.toDate().getTime() == date.getTime()) {
        channel.send(`${reminder.data().title}: ${reminder.data().link}`);
        if (reminder.data().recurring) {
          updateTimeStamp(reminder.data());
        }
      }
    });
  }
}

function removeReminder(reminder, db = null) {
  config.db.collection("reminders").doc(reminder.title).delete();
  return;
}

module.exports = {
  addReminder,
  checkForReminders,
  removeReminder,
};
