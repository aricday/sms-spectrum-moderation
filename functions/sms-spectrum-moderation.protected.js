const fetch = require('node-fetch');
var moment = require('moment-timezone');

exports.handler = async function(context, event, callback) {
  const client = context.getTwilioClient();
  const twiml = new Twilio.twiml.MessagingResponse();

  // timezone default to CST
  let timezone = event.timezone || 'America/Chicago';
  const messageTime = moment().tz(timezone).format();
  
  // Initialize the Spectrum Labs API request message body for inspection
  let spectrumReq = { 
          "timestamp": messageTime,
          "category": "sms",
          "content": {
            "id": event.MessageSid,
            "text": event.Body, 
            "attributes": {
              "user-id": event.From,
              "media-url": event.MediaUrl0,
              "region": event.FromCity + ", " + event.FromState
            }
            }
          };
  
  if (event.From === context.MY_PHONE_NUMBER) {
    const separatorPosition = event.Body.indexOf(':');
    // console.log(separatorPosition);
    
    if (separatorPosition < 1) {
      twiml.message('You need to specify a recipient number and a ":" before the message. For example, "+12223334444: message".');
      callback(null, twiml);
    } else {
      const recipientNumber = event.Body.substr(0, separatorPosition).trim();
      const messageBody = event.Body.substr(separatorPosition + 1).trim();

      try {
        await client.messages
                    .create({
                      to: recipientNumber,
                      from: event.To,
                      body: messageBody
                    });

        return callback(null);
      }
      catch (err) {
        twiml.message("There was an issue with the phone number you entered; please verify it is correct and try again.");
        callback(null, twiml);
      }
    }
  } else {
    const res = await fetch(context.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': context.SPECTRUM_CLIENT_ID,
        'X-Api-Key': context.SPECTRUM_API_KEY
      },
      body: JSON.stringify(spectrumReq),
    });
    
    let data = await res.json();
    let stringData = JSON.stringify(data.behaviors);
    const violationIndex = stringData.indexOf('true');
    // console.log(violationIndex);
    // console.log(data.behaviors);

    if (violationIndex == -1) {
      twiml.message({ to: context.MY_PHONE_NUMBER }, `${event.From}: ${event.Body}`);
      callback(null, twiml);
    }
    else {
      twiml.message({ to: context.MY_PHONE_NUMBER }, `This SMS from ${event.From} was blocked for ${stringData}`);
      callback(null, twiml);
    }
  }
};
