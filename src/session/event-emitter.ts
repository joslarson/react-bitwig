export class EventEmitter {
  listeners: { [key: string]: ((...args: any[]) => void)[] } = {};

  on<Callback extends (...args: any[]) => void>(
    label: string,
    callback: Callback
  ) {
    if (this.listeners[label] && this.listeners[label].indexOf(callback) > -1) {
      throw new Error('Duplicate event subscriptions not allowed');
    }
    this.listeners = {
      ...this.listeners,
      [label]: [...(this.listeners[label] || []), callback],
    };
  }

  addListener<Callback extends (...args: any[]) => void>(
    label: string,
    callback: Callback
  ) {
    this.on(label, callback);
  }

  removeListener<Callback extends (...args: any[]) => void>(
    label: string,
    callback: Callback
  ) {
    const listeners = this.listeners[label];
    const index = listeners ? listeners.indexOf(callback) : -1;

    if (index > -1) {
      this.listeners = {
        ...this.listeners,
        [label]: [...listeners.slice(0, index), ...listeners.slice(index + 1)],
      };
      return true;
    }
    return false;
  }

  emit(label: string, ...args: any[]) {
    try {
      const listeners = this.listeners[label];

      if (listeners && listeners.length) {
        listeners.forEach((listener) => {
          listener(...args);
        });
        return true;
      }
    } catch (e: any) {
      console.error(
        `${e.fileName}:${e.lineNumber}:${e.columnNumber} ${e.message}\n${e.stack}`
      );
    }
    return false;
  }
}
