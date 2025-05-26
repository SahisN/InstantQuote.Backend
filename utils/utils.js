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
  // strip any non-numeric characters from the string
  const numeric_string = number_str.replace(/[^0-9.-]+/g, "");

  // convert the numeric_string to float
  const floatNumber = parseFloat(numeric_string);

  // format the float number into currency format
  return `$${floatNumber.toLocaleString("en-US")}`;
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

export function validateEmail(email) {
  // Regular expression to validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Test the email against the regex
  return emailRegex.test(email);
}

// checks if password is undefined & at least 5 characters long
export function validatePassword(password) {
  if (password) {
    return password.length >= 5;
  }

  return false;
}

// checks if username is undefined & at least 1 character long
export function validateUsername(username) {
  if (username) {
    return username.length >= 1;
  }

  return false;
}
