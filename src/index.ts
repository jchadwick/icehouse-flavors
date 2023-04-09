import * as Alexa from "ask-sdk-core";
import { IntentRequest } from "ask-sdk-model";
import {
  getFlavorsByLocation,
  hasFlavorAvailable as hasFlavorAvailable,
} from "./lib/flavorsService";
import toSsmlList from "./lib/toSSmlList";
import { Flavor, IceHouseLocation, IceHouseLocations } from "./model";

const SKILL_NAME = "Yardley Ice House Flavors";

export const TodaysFlavorIntent = "TodaysFlavors";
export const HasFlavorIntent = "HasFlavor";

const TodaysFlavorsHandler: Alexa.RequestHandler = {
  canHandle: (handlerInput) =>
    Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest" ||
    Alexa.getRequestType(handlerInput.requestEnvelope) ===
      "AMAZON.FallbackIntent" ||
    Alexa.getIntentName(handlerInput.requestEnvelope) === TodaysFlavorIntent,

  handle: async (handlerInput) => {
    const location = getLocation(handlerInput);
    const locationName = IceHouseLocations[location];
    const flavors = await getFlavorsByLocation(location);

    const flavorsByType = flavors.reduce(
      (acc, flavor) => ({
        ...acc,
        [flavor.type]: [
          ...(acc[flavor.type] || []),
          flavor.name || flavor.flavor,
        ],
      }),
      {} as { [key: string]: string[] }
    );

    return handlerInput.responseBuilder
      .withSimpleCard(
        `Today's ${locationName} Flavors`,
        flavorsByType["ice"].join("\r\n") +
          "\r\n\r\n" +
          flavorsByType["cream"].join("\r\n")
      )
      .speak(
        `Today's ${locationName} water ice flavors are: <break strength='medium' />` +
          toSsmlList(flavorsByType["ice"]) +
          `<break strength='strong' /> The soft serve flavors are: <break strength='medium' />` +
          toSsmlList(flavorsByType["cream"])
      )
      .getResponse();
  },
};

const HasFlavorHandler: Alexa.RequestHandler = {
  canHandle: (handlerInput) =>
    Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent",

  handle: async (handlerInput) => {
    const location = getLocation(handlerInput);
    const flavor = getSlot(handlerInput, "flavor");

    if (!flavor) {
      console.log("No flavor slot found");
      return handlerInput.responseBuilder
        .speak("Sorry, I don't know that flavor")
        .getResponse();
    }

    const hasFlavor = await hasFlavorAvailable(location, flavor as string);

    const answer = hasFlavor
      ? `Yep, according to the website, they do have ${flavor}!`
      : `No, sorry - according to the website, do not have ${flavor}.`;

    return handlerInput.responseBuilder
      .withSimpleCard(SKILL_NAME, answer)
      .speak(answer)
      .getResponse();
  },
};

const HelpHandler: Alexa.RequestHandler = {
  canHandle: (handlerInput) =>
    Alexa.getIntentName(handlerInput.requestEnvelope) === HasFlavorIntent,

  handle: async (handlerInput) => {
    const answer = `You can say "Tell me what flavors Ice House has", or, you can say exit... What can I help you with?`;

    return handlerInput.responseBuilder
      .withSimpleCard(SKILL_NAME, answer)
      .reprompt(answer)
      .getResponse();
  },
};

const SpeakHandler: (
  intent: string,
  response: string
) => Alexa.RequestHandler = (intent, response) => ({
  canHandle: (handlerInput) =>
    Alexa.getIntentName(handlerInput.requestEnvelope) === intent,

  handle: async (handlerInput) => {
    return handlerInput.responseBuilder
      .withSimpleCard(SKILL_NAME, response)
      .speak(response)
      .getResponse();
  },
});

const ErrorHandler: Alexa.ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`~~~~ Error handled: ${JSON.stringify(error.stack)}`);
    const speakOutput = handlerInput.context("ERROR_MSG");

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

export const handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    TodaysFlavorsHandler,
    HasFlavorHandler,
    HelpHandler,
    SpeakHandler("AMAZON.CancelIntent", "Goodbye!"),
    SpeakHandler("AMAZON.StopIntent", "Goodbye!")
  )
  .addErrorHandlers(ErrorHandler)
  .withCustomUserAgent("chadsoft/yardley-ice-house-flavors/v1")
  .lambda();

const getSlot = (handlerInput: Alexa.HandlerInput, slotName: string) =>
  (handlerInput.requestEnvelope.request as IntentRequest)?.intent?.slots?.[
    slotName
  ]?.value;

const getLocation = (handlerInput: Alexa.HandlerInput) => {
  const locationSlot = getSlot(handlerInput, "location");
  const location = locationSlot || "yardley";
  return location as IceHouseLocation;
};
