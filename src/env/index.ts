// @ts-nocheck

import { Logger } from './logger';
import { DelayedTask } from './delayed-task';

// specific env setup for bitwig environment
// shim Timeout and Interval methods using DelayedTask class
globalThis.setTimeout = function setTimeout(
  callback: (...args: any[]) => any,
  delay = 0,
  ...params: any[]
) {
  return new DelayedTask(callback, delay).start(...params);
};

globalThis.clearTimeout = function clearTimeout(timeout: DelayedTask) {
  if (timeout) timeout.cancel();
};

globalThis.setInterval = function setInterval(
  callback: (...args: any[]) => any,
  delay = 0,
  ...params: any[]
) {
  return new DelayedTask(callback, delay, true).start(...params);
};

globalThis.clearInterval = function clearInterval(interval: DelayedTask) {
  if (interval) interval.cancel();
};

// shim console with custom logger
globalThis.console = new Logger();

// hookup dummy function to unsupported logger methods

// Console-polyfill. MIT license.
// https://github.com/paulmillr/console-polyfill
// Make it safe to do console.log() always.
const con = globalThis.console;
let prop;
let method;

const dummy = function () {};
const properties = ['memory'];
const methods = [
  'assert',
  'clear',
  'count',
  'debug',
  'dir',
  'dirxml',
  'error',
  'exception',
  'group',
  'groupCollapsed',
  'groupEnd',
  'info',
  'log',
  'markTimeline',
  'profile',
  'profiles',
  'profileEnd',
  'show',
  'table',
  'time',
  'timeEnd',
  'timeline',
  'timelineEnd',
  'timeStamp',
  'trace',
  'warn',
];

while ((prop = properties.pop())) {
  if (!con[prop]) con[prop] = {};
}

while ((method = methods.pop())) {
  if (typeof con[method] !== 'function') con[method] = dummy;
}
