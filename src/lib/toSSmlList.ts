export const toSsmlList = (array: string[]) =>
  array
    .map((x) =>
      x
        .replace("&", "&amp;")
        .replace(/hoc\./g, "hocolate")
        .replace(/ucinno/g, "ucheeno")
    )
    .join(' <break strength="medium" /> ');

export default toSsmlList;
