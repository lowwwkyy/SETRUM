// 1 Week data (7 days)
export const DATA_1W = Array.from({ length: 7 }, (_, i) => ({
  day: i + 1,
  highTmp: 150 + 20 * Math.random(),
}));

// 1 Month data (30 days)
export const DATA_1M = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  highTmp: 140 + 40 * Math.random(),
}));

// 3 Months data (90 days)
export const DATA_3M = Array.from({ length: 90 }, (_, i) => ({
  day: i + 1,
  highTmp: 120 + 60 * Math.random(),
}));

// Keep original data for backward compatibility
export const DATA = DATA_1M;
export const DATA2 = Array.from({ length: 31 }, (_, i) => ({
  day: i,
  highTmp: 40 + 10 * Math.random(),
}));
