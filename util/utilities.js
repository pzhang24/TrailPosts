// --Utility functions--
// Calculates the average of an array of numbers with potentially undefined values
const calcAverage = (arr) => {
  let total;
  let num = 0;
  arr.forEach((number) => {
    if (typeof number === 'number') {
      total = typeof total === 'number' ? total + number : number;
      num++;
    }
  });

  return num > 0 ? total / num : undefined;
};

module.exports = { calcAverage };
