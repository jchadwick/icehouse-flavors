import { DynamoDB } from "aws-sdk";
import { LoggerOptions } from "pino";

export default {
  dynamoTableName: process.env.DYNAMO_TABLE_NAME || "ice_house_flavors",
  dynamoConfig: {
    region: process.env.AWS_REGION || "us-east-1",
  } as DynamoDB.DocumentClient.DocumentClientOptions,
  flavorTtlMinutes: +(process.env.FLAVORS_TTL_MINS || 60 * 3),
  iceHouseUrl: process.env.ICEHOUSE_URL || "https://newtownicehouse.com/",
  log: {
    level: process.env.LOG_LEVEL || "info",
  } as LoggerOptions,
};
