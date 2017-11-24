From time to time I scour the net in look for my blue whale. My blue whale is a virtual personal assistant that I can use through my favourite chat app.  I need my PA to do some basic things like keep me informed of my calendar and remind me of things and answer some basic questions and perhaps some other tasks that I can add to my list along the way. I don't want to interact with multiple bots to have to do all this. There are some OK bots on the facebook messenger platform (notice I said OK, they are not great!) but each o of them does one thing and I don't want to have to interact with 5-10 of them to get what I need.

You will probably say 'hey! use Siri' but really now who want's to talk to a phone? I text all day and I want to be able to text my bot! Google Alo has Google Assistant, and that's the closest I could find to what I need. But no one uses Google Alo. So it would be one more chat app that I need to use just for my assistant. And Google Assistant has some major shortcomings also - like not connecting to both my personal and my business calendar - and it's not extendable with things I might want to add along the way. 

For the reasons mentioned above (and the fact that I am a geek!) I decided to start building my own! What follows is my journey.

I will be using AWS services throughout this as I am familiar with their services and happen to be a gig fan. To follow this you will need to have an amazon account and access to [AWS](https://aws.amazon.com/free/).

# Setting up a very dumb bot
Let's start by setting up a super dumb bot. This bot will recognize when you say hello to it and nothing else. 

To do that access the aws console and go to [Artificial Intelligence > Lex](https://console.aws.amazon.com/lex/home?region=us-east-1#). Lex is  the engine behind Amazon Alexa and we can use it as a service to build conversational interfaces. It can do both voice and text and has a lot of tricks down it's sleeve. Next step is to just click the *create* button. You get a couple of samples but we are going to choose *Custom Bot* and build one from scratch (it's super easy trust me!). 

At this point you need to give it a name (I named mine MiniNadejde). Choose *None* ast your voice as we are only doing text and a random session time out - this is how long your bot will remember what you were talking about (I've put 2 minutes here). Click *Create* and you now have a bot that does nothing:)

To make it do something we need to define an intent. Click *Create Intent* and then *Create new intent*. Name it 'Hello'. What we want with this intent is to teach the bot to react to a greeting. 

Let's give it some *Sample utterances* (what text should this particular intent react to): 'Hello', 'How are you', 'Greetings', 'Ola'. 

Leave *Lambda initialization and validation*, *Slots*, *Confirmation prompt* sections empty for now. And just leave *Fulfillment* set to Return parameters to client. Click *Save Intent* and then *Build* (top right).

Once the build is done we can start testing this! Click on *Test Bot* on the bottom right and give it a try. You will see that when you type 'Hello' or 'How are you' MiniNadejde will return 'ReadyForFulfilment'. That is a good thing as it means we are hitting the intent we just built. However if you type 'Hi' it will not know what you are talking about. That is pretty dumb. If you want it to understand Hi you need to add it to the utterance list (now there are other options, some perhaps smarter, out there and I will be looking at others for a simple example this is a good start. [wit.ai](https://wit.ai), [api.ai](https://api.ai) and [botframework.com](https://dev.botframework.com) are some of the best options)

# Giving it a brain

Now ReadyForFulfilment is not much of an answer to get from our bot. Let's give it a basic brain. For this we need to build a Lambda function to fulfill our Hello intent. Go to [Compute > Lambda](https://console.aws.amazon.com/lambda/home?region=us-east-1) in your AWS console then click *Create a Lambda Function*. Use node.js as runtime and *Blank Function* as blueprint.

You don't need to configure any triggers at the moment. You will need a name. Mine is 'mini-nadejde-hello'. Edit the code inline with this content:

```javascript
exports.handler = (event, context, callback) => {
    //event data will have all the information coming in from amazon lex
    //stuff like user id, message, intent name, session attributes, user input text.
    let user = event.userId; //save the user id

    //fill in the response
    var returnValue = {};
    returnValue.dialogAction = {};
    returnValue.dialogAction.type = 'Close'; //close the dialog
    returnValue.dialogAction.fulfillmentState = 'Fulfilled'; //as fulfilled
    returnValue.dialogAction.message = {};
    returnValue.dialogAction.message.contentType = 'PlainText'; //as text
    returnValue.dialogAction.message.content = 'Hello ' + user + '. I don\'t to anything else at the moment:) Bye!' //with this content
    callback(null, returnValue); //and return the value
};
```

Next we need to set the role for the function in *Lambda function handler and role*. Select *Create new role from template* and just chose *Simple Microservice permission*. At this point this is really not important as our Lambda doesn't need any permissions. Give the role a name. Mine is 'mini-nadejde-lambda'. Live everything else as is and click *Next* and *Create Function*.

We can now test the function by clicking *Test* and putting in some basic test data:
```json
{
  "user": "someid"
}
``` 
Click *Save and test*. Execution should succeed at this point and the response should look like this:
```json
{
  "dialogAction": {
    "type": "Close",
    "fulfillmentState": "Fulfilled",
    "message": {
      "contentType": "PlainText",
      "content": "Hello undefined. I don't to anything else at the moment:) Bye!"
    }
  }
}
```

This Lambda is now all good and set for adding to our intent. You need to head back to Lex and go edit the intent. Next to the intents name there is a small drop-down for choosing a version. Make sure you choose *Latest* or you will not be able to edit anything. Go to the *Fulfillment* section and choose *AWS Lambda function*. The newly created Lambda function should be in the drop-down list. Just select the function and click ok to give add the necessary permissions for Lex to invoke the function. 

Save everything and click *Build*. After the build is done we can test again. Type 'Hello' and check the response coming from your Lambda function. Should be something like 'Hello *userid*. I don't to anything else at the moment:) Bye!'

That's your very dumb bot with a brain up and running!

# Conclusions
I like how easy it is to get going with Lex and Lambda. Everything is very straight forward and easy. Lambda also has a very generous free tier that would cover more than what we need for our bot. 

I don't like however how he utterances work in Lex. It can't match synonyms or similar expressions. Things like Hello, Hi, Greetings need to be defined explicitly and that will be a chore. There's also no way of managing context as far as I can tell and that is important to build anything but trivial conversations. I also don't like the limited integration options, only facebook and slack. 

Next I will move to using [api.ai](https://api.ai) as it seems to be much more feature rich than Amazon Lex. 

References:
* [http://docs.aws.amazon.com/lex/latest/dg/lambda-input-response-format.html](http://docs.aws.amazon.com/lex/latest/dg/lambda-input-response-format.html)
* [http://docs.aws.amazon.com/lex/latest/dg/gs-console.html](http://docs.aws.amazon.com/lex/latest/dg/gs-console.html)