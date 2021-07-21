# Masked Number

Uses a Twilio phone number to relay SMS messages to and from your phone; since the other party only sees your Twilio number, this effectively allows you to mask your phone number for privacy purposes.

## Pre-requisites

### Environment variables

This project requires some environment variables to be set. To keep your tokens and secrets secure, make sure to not commit the `.env` file in git.

Copy the `.env.default` to `.env`.

In your `.env` file, set the following values:

| Variable        | Description                                        | Required |
| :-------------- | :------------------------------------------------- | :------- |
| MY_PHONE_NUMBER | The phone number which SMS messages get relayed to | Yes      |
| WEBHOOK_URL     | The Spectrum Labs API endpoint                     | Yes      |
| SpectrumClientId| The Spectrum ClientID credential                   | Yes      |
| SpectrumApiKey  | The Spectrum Api Key credential                    | Yes      |


## Create the project

1. Install the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart#install-twilio-cli)
2. Install the [serverless toolkit](https://www.twilio.com/docs/labs/serverless-toolkit/getting-started)

```shell
twilio plugins:install @twilio-labs/plugin-serverless
```

3. Clone this project

```
git clone https://github.com/aricday/sms-spectrum-moderation.git && cd sms-spectrum-moderation
```

4. Start the server with the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart):

```
twilio serverless:start
```

5. Open the web page at https://localhost:3000/index.html and enter your phone number to test


## Deploying

Deploy your functions and assets with either of the following commands. Note: you must run these commands from inside your project folder. [More details in the docs.](https://www.twilio.com/docs/labs/serverless-toolkit)

With the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart):

```
twilio serverless:deploy
```
