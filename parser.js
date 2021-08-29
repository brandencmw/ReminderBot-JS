const firebase = require("./firebase");
const config = require("./config");
const botTriggers = ["!addremind", "!remremind", "!showremind"];

function getDatetime(message) {
  var datetimeString;
  if (message.includes("recurring")) {
    datetimeString = message
      .slice(message.indexOf("at") + 1, message.indexOf("recurring") - 1)
      .join(" ");
  } else {
    datetimeString = message.slice(message.indexOf("at") + 1).join(" ");
  }
  return config.moment(datetimeString, "HH:mm ddd, MMM D, YYYY");
}

function formatTimeStamp(googleTimeStamp) {
  var formattedDate = googleTimeStamp.toDate();
  formattedDate = config.moment(formattedDate);
  return formattedDate.format("MMM D, YYYY [at] h:mm A");
}

async function showReminders(db = null) {
  if (!db) db = config.admin.firestore();
  const channel = config.client.channels.cache.get("829052528901357581");
  const reminders = await db.collection("reminders").get();
  var formattedDate;
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

function getIntervalVerb(message) {
  var verb = message[message.indexOf("recurring") + 1];
  console.log(verb);
  var shortVerb;
  switch (verb) {
    case "yearly":
      shortVerb = "y";
      break;
    case "monthly":
      shortVerb = "mo";
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
  }
  return shortVerb;
}

function getIntervalLength(message) {
  var number = message[message.indexOf("recurring") + 2];
  if (Number.isInteger(parseFloat(number))) {
    return number;
  } else {
    console.log("ERROR! NO NUMBER FOUND");
  }
}

function parseMessage(message) {
  messageObject = {
    title: "",
    showtime: "",
    recurring: false,
    intervalVerb: "",
    intervalLen: 0,
    link: "",
  };
  var splitMessage = message.split(" ");
  if (message.includes(" at")) {
    messageObject.title = splitMessage
      .splice(1, splitMessage.indexOf("at") - 1)
      .join(" ");
  } else if (message.includes(" in")) {
    messageObject.title = splitMessage
      .splice(1, splitMessage.indexOf("in") - 1)
      .join(" ");
  } else {
    messageObject.title = splitMessage.splice(1, splitMessage.length).join(" ");
  }

  if (splitMessage[0] === "!addremind") {
    messageObject.link = splitMessage.pop();
    messageObject.recurring = splitMessage.includes("recurring");
    if (message.includes(" at")) {
      messageObject.showtime = getDatetime(splitMessage);
    } else if (message.includes(" in")) {
      calculate_datetime(message).isoformat();
    }
    if (messageObject.recurring) {
      messageObject.intervalVerb = getIntervalVerb(splitMessage);
      messageObject.intervalLen = getIntervalLength(splitMessage);
    }
  }
  return messageObject;
}

config.client.once("ready", () => {
  console.log(`Logged in as ${config.client.user.tag}!`);
  firebase.checkForReminders();
  setInterval(function () {
    firebase.checkForReminders();
  }, 60000);
});

config.client.on("message", (msg) => {
  if (msg.author.bot) return;

  if (botTriggers.some((trigger) => msg.content.startsWith(trigger))) {
    messageObject = parseMessage(msg.content);
    if (msg.content.startsWith("!addremind")) {
      firebase.addReminder(messageObject);
    } else if (msg.content.startsWith("!remremind")) {
      firebase.removeReminder(messageObject);
    } else if (msg.content.startsWith("!showremind")) {
      showReminders();
    }
  }
});

config.client.login(process.env.DISCORD_TOKEN);
