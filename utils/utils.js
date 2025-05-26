import { RATE } from "../constants/index.js";

export function calculatePremium(exposureAmount) {
  // ensures that the string is a valid number (removes $ & commas)
  const numeric_string = exposureAmount.replace(/[^0-9.-]+/g, "");

  // convert the numeric_string to float and multiply by RATE (constant) to get premium
  const premium = parseFloat(numeric_string) * RATE;

  // convert the float number into currency format
  return `$${premium.toLocaleString("en-US")}`;
}

export function formatToCurrency(number_str) {
  // check if number is numeric
  if (!isNaN(number_str) && !isNaN(parseFloat(number_str))) {
    // convert to float to preverse decimals
    const floatNumber = parseFloat(number_str);

    // return formatted currency with $
    return `$${floatNumber.toLocaleString("en-US")}`;
  }

  // returns the same number if it can't be converted to float
  return number_str;
}

// returns current date matching pacific standard time zone
export function getFormatedDateStamp() {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles", // Pacific Time
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
