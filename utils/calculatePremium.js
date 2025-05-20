export default function calculatePremium(exposureAmount) {
  const RATE = 0.015;
  if (typeof exposureAmount !== "number") {
    return parseFloat(exposureAmount) * RATE;
  }
  return exposureAmount * RATE;
}
