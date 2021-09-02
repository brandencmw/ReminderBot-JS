// This file contains all functions relating to CRUD operations in the Firestore database

const config = require("./config");

/*#########################################################################################
# addReminder function                                                                    #
# _______________________________________________________________________________________ #
# Description:                                                                            #
# This function will add a reminder document to the firestore database                    #
# _______________________________________________________________________________________ #
# Parameters:                                                                             # 
# reminder: reminderObject defined in parser.js that is the document to be stored in the  #
#           firestore database                                                            #
# ______________________________________________________________________________________  #
# Returns:                                                                                #
# none                                                                                    #
# _______________________________________________________________________________________ #
#########################################################################################*/
function addReminder(reminder) {
  var docRef = config.db.collection("reminders").doc(reminder.title);
  docRef.set(reminder);
  return;
}

/*#########################################################################################
# checkForReminders function                                                              #
# _______________________________________________________________________________________ #
# Description:                                                                            #
# This function will check the firestore database for any reminders that need to be       #
# presented to the user at the time of calling the function. This function is run every   #
# minute to ensure no reminders are missed                                                #
# _______________________________________________________________________________________ #
# Parameters:                                                                             # 
# none                                                                                    #
# _______________________________________________________________________________________ #
# Returns:                                                                                #
# none                                                                                    #
# _______________________________________________________________________________________ #
#########################################################################################*/
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

/*#########################################################################################
# removeReminder function                                                                 #
# _______________________________________________________________________________________ #
# Description:                                                                            #
# This function will delete a reminder with the specified title from the firestore        #
# database                                                                                #
# _______________________________________________________________________________________ #
# Parameters:                                                                             # 
# title: A string specifying the title of the reminder to be removed from the database.   #
#        This will only delete one reminder as the title is used as the primary key in    #
#        the database                                                                     #
# _______________________________________________________________________________________ #
# Returns:                                                                                #
# none                                                                                    #
# _______________________________________________________________________________________ #
#########################################################################################*/
function removeReminder(title) {
  config.db.collection("reminders").doc(title).delete();
  return;
}

/*#########################################################################################
# updateReminders function                                                                #
# _______________________________________________________________________________________ #
# Description:                                                                            #
# This function checks the database for any reminders that may have been missed during    #
# the bot's downtime. If a reminder is found that has past and is not recurring, it is    #
# removed from the database. If a reminder is found that has past and is recurring, it's  #
# showtime is updated by the document's interval until its time is past the current time  #
# of the function running                                                                 #
# _______________________________________________________________________________________ #
# Parameters:                                                                             # 
# none                                                                                    #
# _______________________________________________________________________________________ #
# Returns:                                                                                #
# none                                                                                    #
# _______________________________________________________________________________________ #
#########################################################################################*/
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

// Export functions for use in the main module
module.exports = {
  addReminder,
  checkForReminders,
  removeReminder,
  updateReminders,
};
