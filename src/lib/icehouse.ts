import axios from "axios";
import { CheerioAPI, load } from "cheerio";
import config from "../config";
import { Flavor, IceHouseLocation } from "../model";
import cleanForMatch from "./cleanForMatch";
import log from "./log";

const getHtml = async (): Promise<CheerioAPI> => {
  log.trace(`Retrieving HTML from ${config.iceHouseUrl}...`);
  const { data: html } = await axios.get(config.iceHouseUrl);
  log.debug(`Retrieved HTML from ${config.iceHouseUrl}`);

  return load(html);
};

export const getLocationFlavors = async (location: IceHouseLocation) =>
  getHtml().then(($) => getFlavors(location, $));

export async function getFlavors(
  location: IceHouseLocation,
  $: CheerioAPI
): Promise<Flavor[]> {
  const locationHeader = $("h4")
    .filter((i, element) =>
      $(element).text().trim().toLowerCase().includes(location)
    )
    .parent()
    .get()
    .find(Boolean);

  const locationContainer = $(locationHeader).parent().get();

  if (!locationContainer) {
    throw new Error(`Could not find location ${location}.`);
  } else {
    log.debug(`Found location ${$(locationHeader).text()}`);
  }

  const rawIceFlavors = $(locationContainer)
    .find("ul")
    .get()
    .map((flavorList) =>
      $(flavorList)
        .find("li")
        .map((_, element) => $(element).text().trim())
        .get()

        .filter(Boolean)
    )
    .find(Boolean) as string[];

  log.debug(`Found ${rawIceFlavors.length} ice flavors.`);
  log.trace("Raw ice flavors:", rawIceFlavors);

  const iceFlavors = rawIceFlavors.map((rawFlavorName) => {
    const matches = /^(.*?)(\s+\(([A-Z, ]+)\))?$/i.exec(rawFlavorName);
    if (!matches?.[1]) return undefined;
    return toFlavor({
      location,
      type: "ice",
      flavor: nameToFlavor(matches[1]),
      name: matches[1],
      flags: matches[3]
        ? matches[3]
            .trim()
            .split(",")
            .map((x) => x.trim())
        : [],
    });
  });

  log.trace(`Ice flavors:`, iceFlavors);

  const rawCreamFlavors = $(locationContainer)
    .find("p")
    .filter((_, element) => $(element).text().startsWith("-"))
    .filter(
      (_, element) =>
        $(element).text().trim().toLowerCase().includes("custard") ||
        $(element).text().trim().toLowerCase().includes("ice cream") ||
        $(element).text().trim().toLowerCase().includes("dole whip")
    )
    .map((_, element) => $(element).text().trim().replace("- ", ""))
    .get()
    .filter(Boolean);

  log.debug(`Found ${rawCreamFlavors.length} cream flavors.`);
  log.trace(`Raw cream flavors:`, rawCreamFlavors);

  const creamFlavors = rawCreamFlavors.map((name: string) =>
    toFlavor({
      location,
      type: "cream",
      name,
    })
  );

  log.trace(`Cream flavors:`, creamFlavors);

  return [...iceFlavors, ...creamFlavors].map((flavor) => ({
    ...flavor,
    updated: new Date(),
  })) as Flavor[];
}

type RequiredExcept<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;

const toFlavor = (
  props: RequiredExcept<Flavor, "location" | "type" | "name">
): Flavor => ({
  ...props,
  flavor: props.flavor || nameToFlavor(props.name || ""),
  match: cleanForMatch(props.name || ""),
});

const nameToFlavor = (name: string) =>
  name
    ?.replace(/ /g, "_")
    .toLowerCase()
    .replace(/[^0-9a-z_]/, "");
