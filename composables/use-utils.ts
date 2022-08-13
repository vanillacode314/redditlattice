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

let start: DOMHighResTimeStamp = undefined;
let previousTimeStamp: DOMHighResTimeStamp = undefined;
let done: boolean = false;
type StepFunction = (elapsed: DOMHighResTimeStamp) => boolean;
function animate(step: StepFunction) {
  function doStep(timestamp: DOMHighResTimeStamp) {
    if (start === undefined) {
      start = timestamp;
    }
    const elapsed = timestamp - start;
    if (previousTimeStamp !== timestamp) {
      done = step(elapsed);
    }
    if (!done) {
      previousTimeStamp = timestamp;
      requestAnimationFrame(doStep);
      return;
    }
    start = undefined;
  }
  requestAnimationFrame(doStep);
}

export default () => {
  return { log, round, reach, sleep, inverseReach, animate };
};
