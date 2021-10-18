# SMS Masking & Moderation w/ Spectrum Labs

This privacy app uses Twilio phone numbers to relay SMS messages to and from users phones, masking the actual phone number from all public senders.  An integration with Spectrum Labs API allows incoming messages to be subjected to abusive content alerting and moderation.  Spectrum Labs AI engine analyzes message content for prohibited behaviors and returns a binary determination for the analyzed profiles.

Spectrum Labs helps social platforms deliver on their brand promises, drive platform improvements and create exponential impact with technology that detects disruptive behaviors in text and audio. In a few lines of code, Twilio users can integrate with Spectrum Labs and prevent messaging harassment, hate speech, scams, profanity, radicalization and other harmful behaviors, leaving room for positive engagement.

## PROJECT SET UP

Call masking and phone number anonymization is a common use case across various industries.  A proxy number is a cloud enabled feature that connects conversation parties without revealing their real phone numbers.  Some people in public roles are required to publish public contact information for receiving community communications.  In some instances, communications may contain unwanted or abusive content, drug references, vulgarity and other objectionable messaging.  This blog will walk you through how to utilize Twilio to create an anonymous SMS proxy to inspect message bodies for abusive content and remove inbound sms communications based on results returned from Spectrum Labs API.  This tutorial shows you how to create an integration with Spectrum Labs API from a Twilio serverless function to mask the actual user’s number and filter content to user’s personal sms device.  This blog builds on the ideas of the application here: [SMS Forwarding and Responding](https://www.twilio.com/blog/sms-forwarding-and-responding-using-twilio-and-javascript)

---

One of the advantages of the Twilio cloud platform is the programmability it provides to core communication channels.  In this instance the ability to intercept an inbound sms, process the message body via api integration with Spectrum Labs for analysis, and process the Spectrum response to forward the message unimpeded to user or block the incoming message and indicate sender of blocked content.  The diagram below illustrates an unwanted escalation from Bucky Badger for an upcoming game in Madison.  The Spectrum profile analysis removes the abusive content detected as shown below.  Bucky starts sending abusive and profane messages which are blocked for Goldy.  In this example we are triggering the results based on a Profanity Behavior return from Spectrum Labs.

![Bad Bucky!](images/useCase.png)

---

To get started with this project you will need the following:
-   A Twilio account. Sign up for a [free trial account](https://www.twilio.com/try-twilio) and get free test credit.
-   An SMS enabled Twilio Phone Number.
-   [Spectrum Labs account](https://www.spectrumlabsai.com/) and access credentials

### Create the SMS Masking App
Before starting, make sure you have a Twilio account. Sign up here for free: www.twilio.com/try-twilio.  If you don't currently own a Twilio phone number with SMS functionality, you'll need to purchase one. Navigate to the Buy a Number page, choose the prefix you want to use under the “Search criteria” - “Search by digits or phrases” and click "Search."  You’ll then see a list of available phone numbers and their capabilities. Find a number that you like and click "Buy" to add it to your account.
![BUY NUMBER](images/buyNumber.png)

In this solution, we will need to buy a unique number for each private number you want to forward calls.  Once you have a number, head to the [Functions Section](https://www.twilio.com/console/functions/overview/services) of the Twilio Console. Create a new service, called spectrum-moderation. Twilio will add a random part to the subdomain to ensure the subdomain is unique.  Click the Next button.


Create a new function with the path /sms-spectrum-moderation.  Delete the placeholder code and paste the following code in the editor window.
```
exports.handler = async function(context, event, callback) {
  const client = context.getTwilioClient();
  const twiml = new Twilio.twiml.MessagingResponse();

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
    twiml.message({ to: context.MY_PHONE_NUMBER }, `${event.From}: ${event.Body}`);
  }

  callback(null, twiml);
};
```

This function code will form the basis of our apps masking feature.  The function logic will branch on the inbound "From" phone number.  All inbound texts to the proxy number will pass to the number we are about to create: MY_PHONE_NUMBER.  Create an environment value entry for *MY_PHONE_NUMBER* with your target mobile phone number including your country code in the E.164 format to forward the SMS. Click “Deploy” to activate the new function.

## Configure Your Phone Number
Using the purchased number we can now configure it to point to your function for incoming SMS.  Make sure you have selected Function from the drop down selection.
![CONFIGURE NUMBER](images/configureNumber.png)

For outbound message sending, this app masks your phone number by relaying them through a Twilio phone number.  Now when an SMS comes in, the function will inspect {{From}} to determine if the sender is MY_PHONE_NUMBER. The {{Body}} content of the SMS will be processed to send inbound SMS to your cell phone with the body of the received SMS and the sender’s phone number.

---
Follow the steps below to test your app:
1.  Text your Twilio phone number with a recipient phone number.  For example, to send the message "hello" to the number "+12223334444", text your Twilio phone number using: +12223334444: hello
2.  Your recipient should receive your message from your Twilio phone number.
3.  When that recipient sends a reply to your Twilio phone number, it will be relayed to your personal phone number.

To try it out, ask a friend to send an SMS to your Twilio number and you should receive the message sent to that Twilio number on your own device set as MY_PHONE_NUMBER.  If the sms is sent from MY_PHONE_NUMBER, the logic will extract the number to send from the message body, preceding the colon ":".

If the logic can’t process where to send "To" the user will see an error message:
*'You need to specify a recipient number and a ":" before the message. For example, "+12223334444: message".'*

We have an anonymous phone proxy setup to provide number masking for inbound sms messages.  We can format outbound sms messages to also send outbound via the proxy Twilio number.  Now let’s integrate with content moderation provided by Spectrum Labs.

## Configure Spectrum Labs API Credentials
To integrate this number with Spectrum Labs APIs you will need the following:
-   The Spectrum Labs API
-   The Spectrum X-Client-ID
-   The Spectrum X-API-Key

Use the values for Spectrum API credentials to configure the following Envrionment Variables:
| Variable          | Description                                        | Required |
| :---------------- | :------------------------------------------------- | :------- |
| MY_PHONE_NUMBER   | The phone number which SMS messages get relayed to | Yes      |
| WEBHOOK_URL       | The Spectrum Labs API endpoint                     | Yes      |
| SPECTRUM_CLIENT_ID| The Spectrum ClientID credential                   | Yes      |
| SPECTRUM_API_KEY  | The Spectrum Api Key credential                    | Yes      |

Add the following dependencies to the service:
| Library           | Version |
| :---------------- | :-------|
| node-fetch        | ^2.6.1  |
| moment-timezone   | 0.5.14  |


Now we will replace the function at path /sms-spectrum-filter with the following code.
```
const fetch = require('node-fetch');
var moment = require('moment-timezone');

exports.handler = async function(context, event, callback) {
  const client = context.getTwilioClient();
  const twiml = new Twilio.twiml.MessagingResponse();

  // timezone default to CST
  let timezone = event.timezone || 'America/Chicago';
  const messageTime = moment().tz(timezone).format();
  
  // Initialize the Spectrum Labs.ai message body for inspection
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
    // console.log(messageTime);

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
```
The code above adds an integration using node-fetch library to send the messasge body to the Spectrum Labs API for content processing.  That's it!  Now you can test an incoming message with no objectionable content to be delivered directly to the user handset.  If the message if flagged to contain vulgarity or other configured behaviors the user will see a message that content was filtered and the behavior result triggered.

## Deploy From GitHub
### Pre-requisites

1. Install the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart#install-twilio-cli)
2. Install the [serverless toolkit](https://www.twilio.com/docs/labs/serverless-toolkit/getting-started)

```shell
twilio plugins:install @twilio-labs/plugin-serverless
```

### Create the project

3. Clone this project

```
git clone https://github.com/aricday/sms-spectrum-moderation.git && cd sms-spectrum-moderation
```

### Environment variables

This project requires some environment variables to be set. To keep your tokens and secrets secure, make sure to not commit the `.env` file in git.

Copy the `.env.default` to `.env`.
```
cp .env.default .env
```

In your `.env` file, set the following values:

| Variable          | Description                                        | Required |
| :---------------- | :------------------------------------------------- | :------- |
| MY_PHONE_NUMBER   | The phone number which SMS messages get relayed to | Yes      |
| WEBHOOK_URL       | The Spectrum Labs API endpoint                     | Yes      |
| SPECTRUM_CLIENT_ID| The Spectrum ClientID credential                   | Yes      |
| SPECTRUM_API_KEY  | The Spectrum Api Key credential                    | Yes      |


4. Install package dependencies

```
npm install
```

5. Start the server with the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart):

```
twilio serverless:start
```

6. Open the web page at https://localhost:3000/index.html and configure your phone number to test


7. Expose the application to the wider Internet using [ngrok](https://ngrok.com/).

    ```bash
    ngrok http 3000
    ```

8. Configure Twilio to call your webhooks. 

   You will need to configure Twilio to call your application when calls are received in your [*Twilio Number*](https://www.twilio.com/console/phone-numbers/incoming). The Messaging URL should look something like this:

   ```
   https://0f72e8a8.ngrok.io/sms-spectrum-moderation
   ```

### Deploying

With the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart):

```
twilio serverless:deploy
```

## License

[MIT](http://www.opensource.org/licenses/mit-license.html)

## Disclaimer

No warranty expressed or implied. Software is as is.

[twilio]: https://www.twilio.com
