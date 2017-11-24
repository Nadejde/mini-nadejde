Last post we had a bot that can understand we want to get a reminder but did not actually remind us of things. This post we will go on to get our bot to actually remind us of things. We will be using [Amazon API Gateway](https://aws.amazon.com/api-gateway/), [AWS Lambda](https://aws.amazon.com/lambda/), [DynamoDB](https://aws.amazon.com/dynamodb/). We will also go through patterns like CQRS and event sourcing so this should be a lot of fun!

# Build an API for our bot to call
If we go into [api.ai console](https://console.api.ai) and select our agent you will see a *fulfillment* option in the menu on the left. This is where we will link our backend webhook. This will be called every time an intent is matched to a user query. So we need to set up an API endpoint with authentication that can take a POST request and respond with a message in the correct format.

We will be using [Amazon API Gateway](https://aws.amazon.com/api-gateway/) to quickly setup our endpoint. If you've just created the AWS account you get 1 million calls per month free for 12 months. Go to [Amazon Console](https://console.aws.amazon.com) > Application Services > [API Gateway] (https://eu-west-1.console.aws.amazon.com/apigateway/). Choose New API and give it a name (mine is MiniNadejde) then click *create*.

We will then click *Actions* > Create Resource. Call it 'bot webhook'. Also check the box next to *Enable API Gateway CORS* and click *Create Resource* button. Click on *Actions* again and select Create Method. Make this a POST and click the little checkbox. You will want Lambda Function as your integration type. Select the same region for your lambda as where you created the API Gateway. You should not have any lambdas on your account so you will be presented with a message to *Create a Lambda Function*. Click that and let's create a quick empty Lambda to link up.

In the Lambda window select Node.js 6 as your runtime and Blank Function. Do not configure any triggers. Name your function 'botWebhook'. In the *Lambda function handler and role* section select 'Create new role from template(s)' for the *Role*. Name it 'lambdaBotRole' and select 'Simple Microservice permissions' under *Policy templates*. Leave the code as is and click *Next* then *Create Function*. You now have a lambda that does nothing to link up to the API.

If you go back to the API Gateway now and just re-select the region the new function will be available. Just type in botWebhook then click *save*. Click *OK* to give API Gateway permissions to invoke the lambda function. If you click *Test* you can test the function to see it works. Live the Request Body empty and click *Test* gain. On the log on the right you should see some records that tell you the lambda replied with the "Hello from Lambda" message.

```bash
Fri Jul 14 16:00:06 UTC 2017 : Received response. Integration latency: 240 ms
Fri Jul 14 16:00:06 UTC 2017 : Endpoint response body before transformations: "Hello from Lambda"
```

Next step is to take the gateway invoke ULR and put it into api.ai in the fulfillment settings like this:  https://<your-url>/bot-webhook/ and click *save*. Next go into the reminder.new intent into the fulfillment section and check the 'Use Webhook' box. Click *save* and try your bot: 'Remind me to call Mom on Monday at 10. It looks like everything went ok but if you click *SHOW JSON* you can see this error:

```json
"status": {
   "code": 206,
   "errorType": "partial_content",
   "errorDetails": "Webhook call failed. Error: Make sure your JSON response conforms to our requirements."
 },
 ```

 As the message says the endpoint does not return the proper JSON format.

# Get the backend endpoint to save and return correct information

Let's write some code now that saves the details into a database and replies to the user. First thing is to setup a node project. We can't keep editing the code in the AWS Lambda interface and we we will also need to add external libraries that we will need to upload. Just create a new folder called lambdas (or whatever name you want) and add a new file called package.json. This is the package.json file I built:
```json
{
 "name": "mini_me_lambdas",
 "version": "1.0.0",
 "description": "lambda functions used by mini me backend",
 "scripts": {
   "test": "echo \"Error: no test specified\" && exit 1"
 },
 "author": "",
 "license": "ISC",
 "dependencies": {
   "aws-sdk": "^2.12.0", //required to access aws services
   "dateformat": "^2.0.0" //some nice date formatting function
 }
}

```

Now create a new file called command_new_reminder.js. This is where our meat is going to be. For now just make it the same as what we already have. We just want to upload and test our project is built fine, then we will add more code:

```javascript
'use strict'

exports.handler = (event, context, callback) => {
 callback(null, 'Hello from Lambda')
}
```

Go into the lambdas folder and run:
```batch
npm install
```

Next archive the folders directory(including node_modules folder). Go to the Lambda on the AWS site and chose the *Code* tab. Upload the new archive there. Go to *Configuration* tab and replace the handler with 'command_new_reminder.handler'. Click *Save and test*. This should do exactly the same as what we had before. But now we can work on it in a proper editor.

Now let's add some validation on the event. We want to first add some simple validation just to make sure we have everything we need. This is how an event looks like coming from api.ai:
```json
{
   "originalRequest": {
       "source": "telegram",
       "data": {
           "update_id": 210425857,
           "message": {
               "date": 1501250920,
               "chat": {
                   "last_name": "Nadejde",
                   "id": 93773717,
                   "type": "private",
                   "first_name": "Andrei"
               },
               "message_id": 153,
               "from": {
                   "language_code": "en-GB",
                   "last_name": "Nadejde",
                   "id": 93773717,
                   "first_name": "Andrei"
               },
               "text": "Remind me to call Sarah tomorrow at 10"
           }
       }
   },
   "id": "e87f9538-c65d-4bb1-9b07-450d6cc525ab",
   "timestamp": "2017-07-28T14:08:40.965Z",
   "lang": "en",
   "result": {
       "source": "agent",
       "resolvedQuery": "Remind me to call Sarah tomorrow at 10",
       "speech": "",
       "action": "reminder.new",
       "actionIncomplete": false,
       "parameters": {
           "date": "2017-07-29",
           "reminderText": "call Sarah",
           "time": "10:00:00"
       },
       "contexts": [
           {
               "name": "generic",
               "parameters": {
                   "date": "2017-07-29",
                   "time.original": "at 10",
                   "reminderText.original": "call Sarah",
                   "telegram_chat_id": "93773717",
                   "date.original": "tomorrow",
                   "time": "10:00:00",
                   "reminderText": "call Sarah"
               },
               "lifespan": 3
           }
       ],
       "metadata": {
           "intentId": "13b718c9-eb43-4839-8f79-8ee012079ab1",
           "webhookUsed": "true",
           "webhookForSlotFillingUsed": "false",
           "intentName": "reminder.new"
       },
       "fulfillment": {
           "speech": "I will remind you to call Sarah on 2017-07-29 at 10:00:00.",
           "messages": [
               {
                   "type": 0,
                   "speech": "I will remind you to call Sarah on 2017-07-29 at 10:00:00."
               }
           ]
       },
       "score": 1
   },
   "status": {
       "code": 200,
       "errorType": "success"
   },
   "sessionId": "830fe53e-c53d-4e29-a4b8-99ac9bbe47cb"
}

```

The things we will need from this event at this point are:

* id // we will use this as a unique event id
* timestamp // so we know what order they came in
* originalRequest.source // so we know what messaging platform the user is on
* originalRequest.data.message.from.id // id of the user so we can send them messages
* originalRequest.data.message.from.first_name // so we can address the user by his/her name when we message them
* result.parameters // we will need to check all 3 parameters are present and valid
* result.action // we will check that the action is reminder.new otherwise we would not know how to deal with this message

We will then build a new object that will get saved in the database:
```javascript
if (event.result.action === 'reminder.new' &&
   event.result.parameters.date &&
   event.result.parameters.reminderText &&
   event.result.parameters.time) {
   let reminder = {
     id: event.id,
     timestamp: event.timestamp,
     aggregateName: 'Reminder', // we will eventually be storing events for other types of requests not just reminders
     eventName: 'ReminderCreated', // name of the sourced event
     eventData: { // data associated with the event
       source: event.originalRequest.source,
       userId: event.originalRequest.data.message.from.id,
       userName: event.originalRequest.data.message.from.first_name,
       parameters: event.result.parameters
     },
     commandData: event // saving the raw command also in case we need some more data in the future
   }
   // console.log(JSON.stringify(reminder))
 }
```
This new variable we created (reminder) needs to get saved into the database.

# Saving to database with DynamoDB

We will quickly setup a DynamoDB table to store these events in. Just navigate to [DynamoDB](https://eu-west-1.console.aws.amazon.com/dynamodb) in the AWS Console and click on Create table. Table name should be mini-me-events or something similar. Partition key is our unique identifier for each event. This is all we need to be concerned about for now. Click *Create table* and we are done here.

Next we need to give the lambda function permission to access the newly created DynamoDB table. For this you need to go into [IAM](https://console.aws.amazon.com/iam) management and select Roles on the right menu. You need to modify the role that the Lambda is on. If you followed instructions it should be 'lambdaBotRole' (if you're not sure check the Configuration tab in the lambda). Click on the role and then click on *Attach Policy*. Check the box next to AmazonDynamoDBFullAccess and click *Attach Policy* (There are ways of restricting access to only specific tables but we want this role to be generic for all our lambdas).

Next step will be actually saving the object into this new table. We will configure the aws sdk first (already included in our dependencies):
```javascript
const AWS = require('aws-sdk')

AWS.config.update({
 region: 'eu-west-1',
 endpoint: 'https://dynamodb.eu-west-1.amazonaws.com'
})
const docClient = new AWS.DynamoDB.DocumentClient()
```
Then we save the object into the database:
```javascript
let params = {
 TableName: 'mini-me-events',
 Item: reminder
}
docClient.put(params, function (err, data) {
 if (err) {
   console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2))
 } else {
   console.log('Added item:', JSON.stringify(data, null, 2))
 }
})
```

And that's all there is to saving this data into DynamoDB.

# Sending correct response to api.ai bot

So far our lambda reads the action and creates an event in the database. But we need to let the user know that it's actually been done. Currently api.ai replies to the user regardless of what the lambda does. So let's update the lambda to return a message to the user. Format of the response is this:
```json
{
  "speech": "Barack Hussein Obama II was the 44th and current President of the United States.",
  "displayText": "Barack Hussein Obama II was the 44th and current President of the United States, and the first African American to hold the office. Born in Honolulu, Hawaii, Obama is a graduate of Columbia University   and Harvard Law School, where ",
  "data": {...},
  "contextOut": [...],
  "source": "DuckDuckGo"
}
```

We will not be sending any data or contextOut. And the displayText and speech will be the same, but will depend on the result of the save operation. We will replace the ```callback(null, 'Hello from Lambda')``` line with appropriate callbacks for each of the scenarios.

The final command_new_reminder.js should look like this:
```javascript
'use strict'
const AWS = require('aws-sdk')

AWS.config.update({
 region: 'eu-west-1',
 endpoint: 'https://dynamodb.eu-west-1.amazonaws.com'
})
const docClient = new AWS.DynamoDB.DocumentClient()

exports.handler = (event, context, callback) => {
 // console.log(JSON.stringify(event))

 if (event.result.action === 'reminder.new' &&
   event.result.parameters.date &&
   event.result.parameters.reminderText &&
   event.result.parameters.time) {
   let reminder = {
     id: event.id,
     timestamp: event.timestamp,
     eventName: 'ReminderCreated', // name of the sourced event
     eventData: { // data associated with the event
       source: event.originalRequest.source,
       userId: event.originalRequest.data.message.from.id,
       userName: event.originalRequest.data.message.from.first_name,
       parameters: event.result.parameters
     },
     commandData: JSON.stringify(event) // saving the raw command also in case we need some more data in the future
   }
   console.log(JSON.stringify(reminder))
   let params = {
     TableName: 'mini-me-events',
     Item: reminder
   }
   docClient.put(params, function (err, data) {
     if (err) {
       console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2))
       callback(null, {
         speech: 'Reply from lambda: Error while saving reminder.',
         displayText: 'Reply from lambda: Error while saving reminder.',
         data: {},
         contextOut: [],
         source: 'lambda'
       })
     } else {
       callback(null, {
        speech: `Reply from lambda: I will remind you to ${reminder.eventData.parameters.reminderText} on ${reminder.eventData.parameters.date} at ${reminder.eventData.parameters.time}.`,
        displayText: `Reply from lambda: I will remind you to ${reminder.eventData.parameters.reminderText} on ${reminder.eventData.parameters.date} at ${reminder.eventData.parameters.time}.`,
        data: {},
        contextOut: [],
        source: 'lambda'
       })
     }
   })
 } else {
   callback(null, {
     speech: 'Reply from lambda: Action not recognized',
     displayText: 'Reply from lambda: Action not recognized.',
     data: {},
     contextOut: [],
     source: 'lambda'
   })
 }
}
```

If you upload the code to lambda and go on telegram to chat would your bot you should see something like this:


Now this is a step forward as now we have saved the data we need to remind people. I had to cut the post short as it was getting way to long and will publish the rest in the next post when we will actually remind people! 

