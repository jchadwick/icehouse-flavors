#!/usr/bin/env ts-node

import { getFlavorsByLocation } from "./src/lib/flavorsService";

async function main() {
  const location = "yardley";
  const flavors = await getFlavorsByLocation(location);
  console.log(JSON.stringify(flavors, null, 2));
}

main();
