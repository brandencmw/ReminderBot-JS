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
  let docRef = config.db.collection("reminders").doc(reminder.title); //Create new reference for reminder to be added
  docRef.set(reminder); //Put reminder object in new reminder reference
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
  // Set seconds and milliseconds to 0 to compare to document TimeStamps
  now.setSeconds(0);
  now.setMilliseconds(0);

  let updatedTime;
  const reminders = await remCollection.get();
  // Loop through all reminders in the db to find any that are supposed to show
  // at the current time
  reminders.forEach((reminder) => {
    // If the time in the reminder is equal to the current time, it should be sent to
    // the user
    if (reminder.data().showtime.toDate().getTime() == now.getTime()) {
      channel.send(`${reminder.data().title}: ${reminder.data().link}`);
      // If the reminder is recurring, its time is updated so it will show again,
      // otherwise, it is removed from the db
      if (reminder.data().recurring) {
        // Switch to moment object for easier manipulation
        updatedTime = config.moment(reminder.data().showtime.toDate());
        // Add interval specified by user
        updatedTime.add(
          reminder.data().intervalLen,
          reminder.data().intervalVerb
        );
        // Update document with new time
        remCollection
          .doc(reminder.data().title)
          .update({ showtime: updatedTime });
      } else {
        removeReminder(reminder.data().title);
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

  const reminders = await remCollection.get(); //Get all reminders in the db
  // Loop through each reminder to see if its timestamp needs to be updated
  reminders.forEach((reminder) => {
    // If the stored time is before the current time, it must be updated or removed
    if (reminder.data().showtime.toDate().getTime() < now.getTime()) {
      // If it is a recurring reminder, the time must be updated, otherwise removed
      if (reminder.data().recurring) {
        // Switching to moment object for easier manipulation
        updatedTime = config.moment(reminder.data().showtime.toDate());
        // Update time by specified interval until it is past the current time
        // so it can be shown again
        do {
          updatedTime.add(
            reminder.data().intervalLen,
            reminder.data().intervalVerb
          );
        } while (updatedTime.toDate().getTime() < now.getTime());
        // Update document with correct showtime
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
