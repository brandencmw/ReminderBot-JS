const config = require("./config");

function addReminder(reminder) {
  var docRef = config.db.collection("reminders").doc(reminder.title);
  docRef.set(reminder);
  return;
}

async function checkForReminders() {
  const channel = config.client.channels.cache.get("829052528901357581");
  const remCollection = config.db.collection("reminders");
  const now = new Date();
  let updatedTime;
  now.setSeconds(0);
  now.setMilliseconds(0);

  console.log("Checking for reminders");

  const reminders = await remCollection.get();
  reminders.forEach((reminder) => {
    if (reminder.data().showtime.toDate().getTime() == now.getTime()) {
      channel.send(`${reminder.data().title}: ${reminder.data().link}`);
      if (reminder.data().recurring) {
        updatedTime = config.moment(reminder.data().showtime.toDate());
        updatedTime.add(
          reminder.data().intervalLen,
          reminder.data().intervalVerb
        );
        remCollection
          .doc(reminder.data().title)
          .update({ showtime: updatedTime });
      }
    }
  });
}

function removeReminder(reminder) {
  config.db.collection("reminders").doc(reminder.title).delete();
  return;
}

async function updateReminders() {
  const remCollection = config.db.collection("reminders");
  const now = new Date();
  let updatedTime;

  const reminders = await remCollection.get();
  reminders.forEach((reminder) => {
    if (reminder.data().showtime.toDate().getTime() < now.getTime()) {
      if (reminder.data().recurring) {
        updatedTime = config.moment(reminder.data().showtime.toDate());
        do {
          console.log("Updating");
          updatedTime.add(
            reminder.data().intervalLen,
            reminder.data().intervalVerb
          );
        } while (updatedTime.toDate().getTime() < now.getTime());
        remCollection
          .doc(reminder.data().title)
          .update({ showtime: updatedTime });
      } else {
        removeReminder(reminder.data().title);
      }
    }
  });
}

module.exports = {
  addReminder,
  checkForReminders,
  removeReminder,
  updateReminders,
};
