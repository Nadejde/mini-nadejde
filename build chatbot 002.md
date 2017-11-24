This turn around we're going to do the same thing we did in the previous post but this time using [api.ai](https://api.ai). [api.ai](https://api.ai) is a little bit smarter so let's see what we can achieve with it.

# Setting up the dumb bot

After signing up for api.ai through a google account just click on it *create agent* to get started on the bot. Add a name and you can leave everything else empty for now. Click *save*.

The new bot will already have two intents created for us. A default fallback one that just gets triggered when the bot does not understand what we are saying to it. The other one is called Default Welcome Intent. This one knows how to say hello. api.ai has the concept of event that helps the bot react to quick actions on different platforms. For example,  the Welcome event reacts to when you add a new bot to your chat. For telegram /start is sent automatically when you add the bot the first time and this intent will be triggered. 

Let's add 'Hi' under *User says*. Then click *save* and try your bot on the right side. Try 'Hi', 'Hello', 'Hola'. You will see that the bot will respond to you with a random phrase in the Text response list for each of those requests. Off the bat you can see that api.ai makes our life easier by shouldering some of the work. It understands that Hello and Hi are the same thing! The quick text responses are good in this very simple example also as we don't need to hook up a brain to do get it to answer.

We shall deal with what Action and Parameters do in the next section where we get our bot to do more that simple answers. Before you move on have a look at the *Small Talk* option on the left menu. Enabling that gives you a lot of built in small talk type queries that your bot can react to. You do need to go through all of them and provide your own answers but still, it's a nice touch for your bot to be able to reply to 'Who are you?' without needing to spend time building each of these intents.

# Make the bot do more
Let's​ see if we can get our bot to do reminders for us. This is where it gets more technical as we will need to build a backend to handle the requests and somehow get the bot to send the reminders to us at the correct time.

Let's start by putting in a new intent. Call it *reminder.new*. In the user says field put 'Remind me to do something at 10 AM tomorrow'. In the action section put reminder.new as this is the action we will need to take on the backend. 

What we need to do now is take the 'Remind me to do something at 10 AM tomorrow' phrase and extract the parameters that we need to use to be able to set a meaningful reminder. These will be a time, date and what the reminder needs to be. After you type the phrase in api.ai will automatically detect two of the parameters. 'at 10 AM' is correctly interpreted as @sys.time, meaning it will pass a time value parameters in the request, while 'tomorrow' is correctly identified as @sys.date. To get the reminder text in as a parameters select the 'do something' part of the phrase and select the entity type @sys.any, as it does not have any meaning that we need the bot to interpret. Also, change the name of this parameter to reminderText.

Click *save* and let's test our bot!. Type Remind me to call mom at 2 PM on Monday on the right-hand side. You will see that the bot successfully figures out the correct time: 14:00, the date which will be the following monday and the reminderText: 'call mom'. You can try specifying the time and date in different formats and test out how good the boot is at recognising the parameters. 'Remind me to call dad at noon on the 21st' also works fine.

However, if you try 'Remind me to call dad on the 21st at noon' the bot does get confused and will not extract the date and time correctly. So let's add this version of the request in the *User says* box and help it figure it out. You will immediately see that it correctly highlights the time and date and we can help it by selecting the reminder text 'call dad' and link it to @sys.any:reminderText parameter. After you save again the bot will recognise this topic also. 'Remind me to call Nana at 12:00 on the 21st December' gets recognised fine now. Pretty cool! 

What happens if a user just asks 'Remind me to call dad at 12'? You will notice that the date parameter does not get filled in. You can either handle this in the backend and assume the date is today. The other thing you can do is to configure the bot to ask for clarifications. Go into the parameters list and check the *Required* box for each parameter. You then get the option to define a prompt for each of the parameters. That's the follow-up question your bot will ask. For example, if the date is missing your prompt can be: 'On what day would you like me to remind you?' If you now save and ask the bot the incomplete query 'Remind me to call Dad at 12' it will get back to you to get the information it needs to build a complete action. If you then provide a correct date the action will get triggered with all the parameters filled in.

Let us add a text response so that we get some feedback in the actual chat. Add this text in 'I will remind you to $reminderText on $date at $time.' Then click save and give it a go. Your bot will reply with a nice confirmation of what you wanted him to do.

So right now you have a very polite bot that gets what you want it to do but doesn't actually do it:) So up next we will need to build the backend to actually store the reminders and make the bot remind us of them:).
