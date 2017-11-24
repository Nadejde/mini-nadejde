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
