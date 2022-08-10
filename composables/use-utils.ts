interface Options {
  stiffness?: number;
}

function reach(
  n: number,
  asymptote: number,
  { stiffness = 2 }: Options = {}
): number {
  return asymptote * (-Math.pow(Math.E, (-1 / stiffness) * n) + 1);
}

function sleep(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function log(base: number, num: number): number {
  return Math.log(num) / Math.log(base);
}

function round(num: number, precision: number = 2): number {
  const p = Math.pow(10, precision);
  return Math.round(num * p) / p;
}

export default () => {
  return { log, round, reach, sleep };
};
