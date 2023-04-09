export const IceHouseLocations = {
  yardley: "Yardley Ice House",
  newtown: "Newtown Ice House",
} as const;

export type IceHouseLocation = keyof typeof IceHouseLocations;

export interface Flavor {
  location: IceHouseLocation;
  flavor: string;
  type: "ice" | "cream";
  name?: string;
  match?: string;
  flags?: string[];
  updated?: Date;
  exp?: Date;
}
