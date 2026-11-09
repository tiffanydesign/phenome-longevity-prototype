/**
 * Each colour field's strong hue (--mid in v2.css), for the places CSS cannot
 * reach: a canvas paints its dots with a colour, not a custom property.
 * Keep in step with the [data-field] rules in v2.css.
 */
export const FIELD_MID: Record<string, string> = {
  capacity: "#3478f6",
  vitals: "#32ade6",
  habit: "#3dbfaa",
  activity: "#fa6431",
  food: "#e68c2c",
  heart: "#fa3c5a",
  rose: "#e0559a",
  lavender: "#7d7aff",
  teal: "#30b0c7",
  sand: "#a2845e",
  mist: "#263980",
};
