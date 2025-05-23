export function calculatePremium(exposureAmount) {
  const RATE = 0.015;

  const premium = parseFloat(exposureAmount) * RATE;
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

export function getFormatedDateStamp() {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles", // Pacific Time
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
