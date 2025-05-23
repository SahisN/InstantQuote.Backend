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
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const year = now.getFullYear();

  return `${month}/${day}/${year}`;
}
