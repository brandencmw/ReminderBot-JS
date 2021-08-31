const firebase = require("./firebase");
const config = require("./config");
const botTriggers = ["!addremind", "!remremind", "!showremind"];

function SyntaxError(errorMessage) {
  this.message = errorMessage;
  this.name = "Syntax Error";
}

function getDatetime(message) {
  let datetimeString;
  if (message.includes("recurring")) {
    datetimeString = message
      .slice(message.indexOf("at") + 1, message.indexOf("recurring") - 1)
      .join(" ");
  } else {
    datetimeString = message.slice(message.indexOf("at") + 1).join(" ");
  }

  return config.moment(datetimeString, "HH:mm ddd, MMM D, YYYY", true);
}

function formatTimeStamp(googleTimeStamp) {
  let formattedDate = googleTimeStamp.toDate();
  formattedDate = config.moment(formattedDate);
  return formattedDate.format("MMM D, YYYY [at] h:mm A");
}

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

function getIntervalVerb(message) {
  var verb = message[message.indexOf("recurring") + 1];
  console.log(verb);
  var shortVerb;
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
    throw new SyntaxError("Missing keyword 'at' to determine reminder time");
  }

  messageObject.link = splitMessage.pop();
  messageObject.recurring = splitMessage.includes("recurring");

  messageObject.showtime = getDatetime(splitMessage);
  if (!messageObject.showtime.isValid()) {
    throw new SyntaxError("Date format invalid");
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
      let title = msg.content.substring(msg.content.indexOf(" "));
      firebase.removeReminder(title);
    } else if (msg.content.startsWith("!showremind")) {
      showReminders();
    }
  }
});

config.client.login(process.env.DISCORD_TOKEN);
