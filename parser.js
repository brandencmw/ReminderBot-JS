// This file contains all functions relating to parsing Discord user messages
// and sending return messages to the user

const firebase = require("./firebase");
const config = require("./config");
const errors = require("./errors");
const botTriggers = ["!addremind", "!remremind", "!showremind"];

/*#########################################################################################
# getDatetime function                                                                    #
# _______________________________________________________________________________________ #
# Description:                                                                            #
# This function will parse the datetime string from the full Discord message by taking    #
# the substring from the word 'at' onward or between 'at' and 'recurring' for recurring   #
# reminders                                                                               #
# _______________________________________________________________________________________ #
# Parameters:                                                                             # 
# message: A string containing the Discord message sent by the user from which the        #
#         datetime part needs to be extracted                                             #
# _______________________________________________________________________________________ #
# Returns:                                                                                #
# A moment.js object that has the proper datetime specified by the user as long as it     #
# matches the required formatting string. Otherwise an invalid moment object is returned  #
# _______________________________________________________________________________________ #
#########################################################################################*/
function getDatetime(message) {
  let datetimeString;
  if (message.includes("recurring")) {
    datetimeString = message
      .slice(message.indexOf("at") + 1, message.indexOf("recurring") - 1)
      .join(" ");
  } else {
    datetimeString = message.slice(message.indexOf("at") + 1).join(" ");
  }

  return config.moment(datetimeString, "HH:mm ddd, MMM D, YYYY");
}

/*#########################################################################################
# formatTimeStamp function                                                                #
# _______________________________________________________________________________________ #
# Description:                                                                            #
# This function returns a formatted moment object in order to send a formatted message    #
# to the user once they ask to be shown their reminders                                   #
# _______________________________________________________________________________________ #
# Parameters:                                                                             # 
# googleTimeStamp: a TimeStamp object that is returned from Firestore specifying what     #
#                  time the reminder is to appear                                         #
# _______________________________________________________________________________________ #
# Returns:                                                                                #
# A moment.js object formatted by the specified formatting string                         #
# _______________________________________________________________________________________ #
#########################################################################################*/
function formatTimeStamp(googleTimeStamp) {
  let formattedDate = googleTimeStamp.toDate();
  formattedDate = config.moment(formattedDate);
  return formattedDate.format("MMM D, YYYY [at] h:mm A");
}

/*#########################################################################################
# showReminders function                                                                  #
# _______________________________________________________________________________________ #
# Description:                                                                            #
# This function shows the user all reminders they have stored in the database including   #
# the next time that the reminder is set to show                                          #
# _______________________________________________________________________________________ #
# Parameters:                                                                             # 
# none                                                                                    #
# _______________________________________________________________________________________ #
# Returns:                                                                                #
# none                                                                                    #
# _______________________________________________________________________________________ #
#########################################################################################*/
async function showReminders() {
  const channel = config.client.channels.cache.get("829052528901357581");
  const reminders = await config.db.collection("reminders").get();
  let formattedDate;
  if (!reminders.empty) {
    channel.send("You have the following reminders...");

    reminders.forEach((reminder) => {
      formattedDate = formatTimeStamp(reminder.data().showtime);
      channel.send(
        `${reminder.data().title} set to remind you ${formattedDate}`
      );
    });
  } else {
    channel.send("There are no reminders");
  }
}

/*#########################################################################################
# getIntervalVerb function                                                                #
# _______________________________________________________________________________________ #
# Description:                                                                            #
# This function will find the type of recurrence the user wants for this reminder.        #
# Possible options are yearly, monthly, weekly, daily, hourly, and minutely recurrence    #
# _______________________________________________________________________________________ #
# Parameters:                                                                             # 
# message: A string containing the Discord message from which the recurrence type must be #
#          extracted                                                                      #
# _______________________________________________________________________________________ #
# Returns:                                                                                #
# shortVerb: a one-character String that represents the recurrence type specified by the  #
#            user. Works with moment.js formatting to make recurrence easier. if one      #
#            cannot be found, a syntax error will be thrown                               #
# _______________________________________________________________________________________ #
#########################################################################################*/
function getIntervalVerb(message) {
  let verb = message[message.indexOf("recurring") + 1];
  let shortVerb;
  switch (verb) {
    case "yearly":
      shortVerb = "y";
      break;
    case "monthly":
      shortVerb = "M";
      break;
    case "weekly":
      shortVerb = "w";
      break;
    case "daily":
      shortVerb = "d";
      break;
    case "hourly":
      shortVerb = "h";
      break;
    case "minutely":
      shortVerb = "m";
      break;
    default:
      throw new errors.SyntaxError("Missing or incorrect recurrence keyword");
  }
  return shortVerb;
}

/*#########################################################################################
# getIntervalLength function                                                              #
# _______________________________________________________________________________________ #
# Description:                                                                            #
# This function gets the length of the interval specified by the user. For example, if    #
# the user specifies recurrence of 'weekly 3' the reminder will recur every 3 weeks       #
# _______________________________________________________________________________________ #
# Parameters:                                                                             # 
# message: A string containing the Discord message from which the interval length is to   #
#          be extracted                                                                   #
# _______________________________________________________________________________________ #
# Returns:                                                                                #
# The number representing the recurrence length. Or, if one cannot be found, a syntax     #
# error will be thrown                                                                    #
# _______________________________________________________________________________________ #
#########################################################################################*/
function getIntervalLength(message) {
  let number = message[message.indexOf("recurring") + 2];
  if (Number.isInteger(parseFloat(number))) {
    return number;
  } else {
    throw new errors.SyntaxError("Missing or incorrect recurrence length");
  }
}

/*#########################################################################################
# parseMessage function                                                                   #
# _______________________________________________________________________________________ #
# Description:                                                                            #
# This function will parse the Discord message sent in by the user when they want to add  #
# a reminder and extract the parts of the message necessary for the document to be        #
# uploaded to the firestore database                                                      #
# _______________________________________________________________________________________ #
# Parameters:                                                                             # 
# message: A string containing the Discord message from which the parts of the message    #
#          document must be extracted                                                     #
# _______________________________________________________________________________________ #
# Returns:                                                                                #
# messageObject: A JavaScript object containing fields for all of the information         #
#                necessary for the reminder document to be stored. If an error is         #
#                encountered at any point, it will be thrown and the user will be         #
#                notified. Nothing is returned in this case                               #
# _______________________________________________________________________________________ #
#########################################################################################*/
function parseMessage(message) {
  const messageObject = {
    title: "",
    showtime: "",
    recurring: false,
    intervalVerb: "",
    intervalLen: 0,
    link: "",
  };
  let splitMessage = message.split(" ");
  if (message.includes(" at")) {
    messageObject.title = splitMessage
      .splice(1, splitMessage.indexOf("at") - 1)
      .join(" ");
  } else {
    throw new errors.SyntaxError(
      "Missing keyword 'at' to determine reminder time"
    );
  }

  messageObject.link = splitMessage.pop();
  messageObject.recurring = splitMessage.includes("recurring");

  messageObject.showtime = getDatetime(splitMessage);
  if (!messageObject.showtime.isValid()) {
    throw new errors.DateError("Date format invalid");
  } else if (messageObject.showtime.toDate().getTime() < new Date().getTime()) {
    throw new errors.DateError("Date cannot be a date in the past");
  }

  if (messageObject.recurring) {
    messageObject.intervalVerb = getIntervalVerb(splitMessage);
    messageObject.intervalLen = getIntervalLength(splitMessage);
  }

  return messageObject;
}

config.client.once("ready", () => {
  console.log(`Logged in as ${config.client.user.tag}!`);
  firebase.updateReminders();
  setInterval(function () {
    firebase.checkForReminders();
  }, 60000);
});

config.client.on("message", (msg) => {
  const channel = config.client.channels.cache.get("829052528901357581");

  if (msg.author.bot) return;

  if (botTriggers.some((trigger) => msg.content.startsWith(trigger))) {
    if (msg.content.startsWith("!addremind")) {
      try {
        let messageObject = parseMessage(msg.content);
        firebase.addReminder(messageObject);
      } catch (err) {
        channel.send(`${err.name}: ${err.message}`);
      }
    } else if (msg.content.startsWith("!remremind")) {
      let title = msg.content.substring(msg.content.indexOf(" ") + 1);
      console.log(title);
      firebase.removeReminder(title);
    } else if (msg.content.startsWith("!showremind")) {
      showReminders();
    }
  }
});

config.client.login(process.env.DISCORD_TOKEN);
