import { defineTable, TableClient } from "@hexlabs/dynamo-ts";
import { DynamoDB } from "aws-sdk";
import { add, fromUnixTime, getUnixTime } from "date-fns";
import config from "../config";
import { Flavor } from "../model";

const flavorsTableDefinition = defineTable(
  {
    location: "string",
    flavor: "string",
    type: "string",
    name: "string?",
    exp: "number",
    updated: "number",
    flags: { optional: true, array: "string" },
  },
  "location",
  "flavor",
  {}
);

const dbClient = new DynamoDB.DocumentClient(config.dynamoConfig);

const flavorsTable = TableClient.build(flavorsTableDefinition, {
  tableName: config.dynamoTableName,
  client: dbClient,
  logStatements: true,
});

export type LocationAndTypeKey = Pick<Flavor, "location" | "flavor">;

export const getFlavorsByLocation = (location: string) =>
  flavorsTable
    .queryAll({ location })
    .then((x) => x.member?.map(fromFlavorRecord));

export const setFlavors = (flavors: Flavor[]) =>
  flavorsTable.batchPut(flavors.map(toFlavorRecord)).execute();

export interface FlavorRecord {
  type: string;
  name?: string;
  flavor: string;
  location: string;
  flags?: string[];
  /** last updated date, in UNIX time */
  updated: number;
  /** expiration date, in UNIX time */
  exp: number;
}

const fromFlavorRecord = ({
  updated,
  exp,
  ...flavor
}: FlavorRecord): Flavor => ({
  ...(flavor as Flavor),
  updated: fromUnixTime(updated),
  exp: fromUnixTime(exp),
});

const toFlavorRecord = ({ updated, exp, ...flavor }: Flavor): FlavorRecord => {
  const updatedForReal = updated || new Date();
  const expForReal = add(exp || updatedForReal, {
    minutes: config.flavorTtlMinutes,
  });

  return {
    ...(flavor as FlavorRecord),
    updated: getUnixTime(updatedForReal),
    exp: getUnixTime(expForReal),
  };
};
