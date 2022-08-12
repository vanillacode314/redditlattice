interface Options {
  stiffness?: number;
}

function reach(x: number, N: number, { stiffness = 1 }: Options = {}): number {
  return -N * (Math.pow(Math.E, -x / stiffness) - 1);
}
function inverseReach(
  reach: number,
  N: number,
  { stiffness = 1 }: Options = {}
): number {
  return -Math.log(-reach / N + 1) * stiffness;
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
  return { log, round, reach, sleep, inverseReach };
};
