Last post we built the first part of our backend and saved the ReminderCreated event into our event store. Now we will build a database of reminders and setup to bot to actually remind the user. 

# Setup event triggers on dynamoDB

DynamoDB has a cool feature called triggers. Whenever an item in a table is modified or created (we're only interested in created in the event store anyway) we can trigger a lambda. This is cool as we can completely segregate the responsibilities. The lambda function we've built previously will only concern itself with dumping the data into the DynamoDB table and we can build another function that picks up the data and builds the reminder database. 

Let's go into [DynamoDB](https://eu-west-1.console.aws.amazon.com/dynamodb) dashboard choose your events table and go to the *Triggers* tab. Click on *Create trigger* and choose *New function*. You will be presented with a wizard to set up the lambda and the trigger. Select the table in DynamoDB Table. Set the batch size to 1. We only want to retrieve the last record every time a new record is created. Starting position should be latest, we always want to read the latest record. Select *Enable trigger* and click *Next*. Now we need to configure the lambda function. Set the name to "reminder-event-processor". Set the runtime to Node.js 6.10. Leave the default code in for now. Scroll down to existing role and choose the previously crated role (mine is called lambdaBotRole). Click *Next* and then *Create function*. We now have a trigger that calls a lambda function every time something changes in this table. 

We can now test that this works. Just go to the bot and schedule a reminder. You can now go to the new lambda function and select the Monitoring tab. Click *View logs in CloudWatch*. You should now see the following logged:
```
2017-08-11T10:47:06.171Z	41c0600f-90a9-4406-a483-02beab5cd356	7f53ff1ee2b57739e414ba801b9cd236

10:47:06
2017-08-11T10:47:06.228Z	41c0600f-90a9-4406-a483-02beab5cd356	INSERT

10:47:06
2017-08-11T10:47:06.228Z	41c0600f-90a9-4406-a483-02beab5cd356	DynamoDB Record: {"ApproximateCreationDateTime":1502448420,"Keys":{"id":{"S":"aea6a9eb-46f4-4b59-b27d-dcee7f52671f"}},"NewImage":{"eventData":{"M":{"source":{"S":"telegram"},"userName":{"S":"Andrei"},"userId":{"N":"93773717"},"parameters":{"M":{"date":{"S":"2017-08-12"},"reminderText":{"S":"wash the dog to"},"time":{"S":"17:00:00"}}}}},

10:47:06
END RequestId: 41c0600f-90a9-4406-a483-02beab5cd356
```

This means that the lambda is triggered as expected. 

# Build the reminders database

We can create a new table now to hold the actual reminders. Now there's a big difference between this new table and the events one. This table is meant to hold a snapshot of each reminder as it is at the moment, meaning that if we add more functionality in the future like edit or delete reminders table rows in the new table will actually be updated (or deleted). This new table will also support querying. We will be using DynamoDB for convenience but this can also be a relational database for example, and at some point it might make sense to switch to one. 

This new table will need to save the following columns: source, userId, userName, timestamp (this will be date+time of the reminder), reminderText and id. We don't need anything else to have a meaningful reminder. Lets call this table reminders. I've set the primary key to be on the id column. 

I've added a secondary index by userId sorted by timestamp. This index will be useful when a user wants to know what reminders they have setup. You can query the table just by that userId very fast.

Another secondary index that will be useful for us is one just by timestamp. We will build a job that runs every minute and looks for all the reminders in that minute. This is where querying the timestamp index will be useful.

After creating the table and adding the indexes we have a new table called reminders that will have the id, userId and timestamp attributes as mandatory. We don't need to specify the others in advance and we can create them on the fly if we need them or not.

# Write the reminder event processor lambda

We can now write the lambda function that reacts to an event being inserted into the database and keeps the reminder aggregate up to date.

