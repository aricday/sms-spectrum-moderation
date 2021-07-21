const fetch = require('node-fetch');

exports.handler = async function(context, event, callback) {
  const client = context.getTwilioClient();
  const twiml = new Twilio.twiml.MessagingResponse();
  let spectrumReq = { 
          "category": "chats",
          "content": {
            "id": event.MessageSid,
            "text": event.Body, 
            "attributes": {
              "user-id": "a423jhdf6f",
              "context-id": "b45796376dg",
              "user-sign-up": "2020-02-15T15:14:27.987Z"
            }
            }
          };

  if (event.From === context.MY_PHONE_NUMBER) {
    const separatorPosition = event.Body.indexOf(':');

    if (separatorPosition < 1) {
      twiml.message('You need to specify a recipient number and a ":" before the message. For example, "+12223334444: message".');
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
      }
    }
  } else {
    const res = await fetch(context.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': context.SpectrumClientId,
        'X-Api-Key': context.SpectrumApiKey
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
      twiml.message({ to: context.MY_PHONE_NUMBER }, `This SMS from ${event.From} was blocked for content.`);
      callback(null, twiml);
    }
  }
};
