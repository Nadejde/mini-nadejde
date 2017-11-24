'use strict'
const AWS = require('aws-sdk')

AWS.config.update({
  region: 'eu-west-1',
  endpoint: 'https://dynamodb.eu-west-1.amazonaws.com'
}) // TODO: it is probably a good idea to keep these as external configuration parameters
const docClient = new AWS.DynamoDB.DocumentClient()

function insertReminder (id, eventData) {
  let dateTime = new Date(eventData.parameters.M.date.S + 'T' + eventData.parameters.M.time.S + 'Z')
  // in case you are wondering what .S .N or .M is that is because the format dynamoDB keeps records in to specify types.
  let reminder = {
    id: id,
    source: eventData.source.S,
    userName: eventData.userName.S,
    userId: eventData.userId.N,
    timestamp: dateTime.getTime(),
    reminderText: eventData.parameters.M.reminderText.S
  }

  let params = {
    TableName: 'reminders',
    Item: reminder
  }
  docClient.put(params, function (err, data) {
    if (err) {
      console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2))
    } else {
      console.log('Successfully added reminder: ' + JSON.stringify(reminder))
    }
  })
}

exports.handler = (event, context, callback) => {
  // console.log('Received event:', JSON.stringify(event, null, 2));
  event.Records.forEach((record) => {
    if (record.eventName !== 'INSERT') {
      console.error('Unexpected database event') // We should only be getting INSERT events from database
    } else {
      console.log(JSON.stringify(record))
      insertReminder(record.dynamodb.Keys.id.S, record.dynamodb.NewImage.eventData.M)
    }
  })
  callback(null, `Successfully processed ${event.Records.length} records.`)
}
