#!/usr/bin/env ts-node

import {
  AmazonIntent,
  ControlInteractionModelGenerator,
} from "ask-sdk-controls";
import { HasFlavorIntent, TodaysFlavorIntent } from "../src";

const model = new ControlInteractionModelGenerator()
  .withInvocationName("ice house")
  .addIntent({
    name: AmazonIntent.FallbackIntent,
  })
  .addIntent({
    name: AmazonIntent.HelpIntent,
  })
  .addIntent({
    name: AmazonIntent.CancelIntent,
  })
  .addIntent({
    name: AmazonIntent.StopIntent,
  })
  .addIntent({
    name: TodaysFlavorIntent,
    samples: [
      "their flavors",
      "their flavors today",
      "their flavors tonight",
      "what flavors there are",
      "what flavors there are today",
      "what flavors there are tonight",
      "what flavors they have",
      "what flavors they have tonight",
      "what flavors they have today",
      "what their flavors are today",
      "what their flavors are tonight",
    ],
  })
  .addIntent({
    name: HasFlavorIntent,
    slots: [
      {
        name: "flavor",
        type: "AMAZON.Dessert",
      },
    ],
    samples: [
      "if there is {flavor}",
      "if they have {flavor}",
      "if they have {flavor} today",
      "if they have {flavor} tonight",
    ],
  })
  .build();

console.log(JSON.stringify(model, null, 2));
