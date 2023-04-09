export const cleanForMatch = (value: string): string =>
  value
    .toLowerCase()
    .replace(/ /g, "")
    .replace("&", "and")
    .replace(/choc\./g, "chocolate");

export default cleanForMatch;
