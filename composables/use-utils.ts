interface Options {
  stiffness?: number;
}

export function getKeys(obj: Object, keys: string[]): Object {
  const retval = {};
  keys.forEach((key) => {
    if (Object.hasOwn(obj, key)) retval[key] = obj[key];
  });
  return retval;
}

/**
 * Return value approaches N as x approaches 1
 * @param {number} x - input value a number b/w 0 and 1
 * @param {number} N - value to approach / reach
 * @param {Options} [options={}] - options to modify the curve
 * @param {number} [options.stiffness=1] - the stiffness of the curve
 */
export function reach(
  x: number,
  N: number,
  { stiffness = 1 }: Options = {}
): number {
  return -N * (Math.pow(Math.E, -x / stiffness) - 1);
}

/**
 * Return value approaches 1 as x approaches N
 *
 * @param {number} x - input value aka the reach func return value
 * @param {number} N - value that x approached / reached
 * @param {Options} [options={}] - options to modify the curve
 * @param {number} [options.stiffness=1] - the stiffness of the curve
 */
export function inverseReach(
  x: number,
  N: number,
  { stiffness = 1 }: Options = {}
): number {
  return -Math.log(-x / N + 1) * stiffness;
}

/**
 * a sleep function to use in async functions, uses setTimeout
 *
 * @param {number} duration - duration to sleep for
 */
export function sleep(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

/**
 * log function with arbitrary base
 *
 * @param {number} base - base to use
 * @param {number} num - number to find log of
 * @returns {number} log of num with the given base
 */
export function log(base: number, num: number): number {
  return Math.log(num) / Math.log(base);
}

/**
 * round function with arbitrary precision
 *
 * @param {number} num - number to round
 * @param {number} [precision] - precision aka number of decimal places to keep
 * @returns {number} the num rounded to precision decimal places
 */
export function round(num: number, precision: number = 2): number {
  const p = Math.pow(10, precision);
  return Math.round(num * p) / p;
}

type StepFunction = (elapsed: DOMHighResTimeStamp) => boolean;
/**
 * schedules the step function using requestAnimationFrame the step
 * function provided is called with the amount of milliseconds elapsed
 *
 * @param {StepFunction} step - callback that takes number of milliseconds elapsed as its
 * first argument and it must return a boolean that should be true when the animation is done
 */
export function animate(step: StepFunction) {
  let start: DOMHighResTimeStamp = undefined;
  let previousTimeStamp: DOMHighResTimeStamp = undefined;
  let done: boolean = false;
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
