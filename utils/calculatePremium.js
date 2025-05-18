export default function calculatePremium(exposureAmount) {
  const RATE = 0.015;

  return exposureAmount * RATE;
}
