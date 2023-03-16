export class DelayedTask {
  callback: Function;
  delay: number;
  repeat: boolean;
  cancelled = false;

  constructor(callback: (...args: any[]) => any, delay = 0, repeat = false) {
    this.callback = callback;
    this.delay = delay;
    this.repeat = repeat;
  }

  start(...args: any[]) {
    host.scheduleTask(() => {
      if (!this.cancelled) {
        this.callback.call(args);
        if (this.repeat) this.start(...args);
      }
    }, this.delay);
    return this;
  }

  cancel() {
    this.cancelled = true;
    return this;
  }
}
