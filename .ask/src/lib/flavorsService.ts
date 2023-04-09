#!/usr/bin/env ts-node

import {
  getFlavorsByLocation as getFlavorsByLocationFromDb,
  setFlavors,
} from "./flavorDb";
import { getLocationFlavors } from "./icehouse";
import log from "./log";
import { Flavor, IceHouseLocation } from "../model";
import cleanForMatch from "./cleanForMatch";

export async function hasFlavorAvailable(
  location: IceHouseLocation,
  flavor: Flavor["flavor"]
) {
  const flavorMatch = cleanForMatch(flavor);
  const flavors = await getFlavorsByLocationFromDb(location);
  return flavors.some(
    (f) => f.match || cleanForMatch(f.name || f.flavor) === flavorMatch
  );
}

export async function getFlavorsByLocation(location: IceHouseLocation) {
  const cachedFlavors = await getFlavorsByLocationFromDb(location);

  if (cachedFlavors.length) {
    log.info(`Returning ${cachedFlavors.length} cached flavors`);
    return cachedFlavors;
  }

  log.info(`No cached flavors - retrieving from Ice House...`);

  const flavors = await getLocationFlavors(location);

  log.info(
    `Retrieved ${flavors.length} flavors from Ice House. Saving to cache...`
  );
  await setFlavors(flavors);
  return flavors;
}
