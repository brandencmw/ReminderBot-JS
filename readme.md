# Reminder Bot JS

## Inspiration

After an online semester at school I realized there was a course in which I taught myself most of the material and so I often forgot to
attend my live lectures. This hurt my overall grade as attendance was counted in that class. That is why I decided to write this bot so I would never forget to attend any of my classes even if I felt that attending the lectures was unncessary.
<p>&nbsp;</p>


## Description
This bot can be used in any Discord server. It will look for certain trigger words in messages. Users can add, remove, and view reminders stored in a firestore database on Google servers.
<p>&nbsp;</p>


## Syntax


### Adding reminders
The general syntax of the add statment is `!addremind[title]at[datetime]`_recurring_`[interval][intervalLength][link]` where...
* __title__: The title of your reminder that will be displayed. Must be included and unique as it identifies the reminder.
* __datetime__: A string representing a datetime in the format of Day, Month Day number, Year Hour:Minute where...
    - Day: The full name of the day of the week on which your reminder will first appear. Ex: Monday
    - Month: The full name of the month in which your reminder will first appear. Ex: August
    - Day number: The day of the month on which your reminder will first appear without preceding 0. Ex: 3, 24
    - Year: The 4 digit year in which your reminder will first appear. Ex: 2021
    - Hour: The hour in which your reminder will first appear without preceding 0. From 0 to 23 as it is in 24 hour time. Ex: 7, 21
    - Minute: The minute in which your reminder will first appear. From 00-59 with preceding 0. Ex: 05, 54
* __interval__: The adverb describing the length of the interval. Options include...
    - Yearly
    - Monthly
    - Weekly
    - Daily
    - Hourly
    - Minutely
* __intervalLength__: A natural number corresponding to the length of the interval.
    _For example: "monthly 4" would repeat every 4 months and "weekly 3" would repeat every 3 weeks
* __link__: The link to the meeting your reminder is associated with

### Removing reminders
The general syntax of the remove statement is `!addremind[title]` where title is the title of the reminder to be removed. Removal is permanent. After a reminder is removed, you may add it back using the !addremind statement


### Displaying reminders
To use the display statement enter `!showremind`. Any text after this command will be ignored by the bot
<p>&nbsp;</p>


## Example Prompts

### `!addremind`
    - `!addremind Science Class at 8:30 Monday, September 6, 2021 recurring weekly 1 zoom.us`
    - `!addremind` Meeting at 14:05 Tuesday, September 7, 2021 google.meets`


### `!remremind`
    - `!remremind Science Class`
    - `!remremind Meeting`


### `!showremind`
    -!showremind`
    -`showremind hey how's it going?` Reminder: any text after the prompt for this command will be ignored
