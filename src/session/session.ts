import '../env';
import { EventEmitter } from './event-emitter';
import { MidiConnector } from '../controls/midi/midi-connector';
import { Logger } from '../env/logger';

declare const globalThis: {
  init: () => void;
  flush: () => void;
  exit: () => void;
};

export interface Session extends EventEmitter {
  on(label: 'init' | 'flush' | 'exit', callback: () => void): void;

  addListener(label: 'init' | 'flush' | 'exit', callback: () => void): void;

  removeListener(
    label: 'init' | 'flush' | 'exit',
    callback: () => void
  ): boolean;
}

export class Session extends EventEmitter {
  private _isExitPhase: boolean = false;
  private _isInitPhase: boolean = false;
  private _isInitInitialized: boolean = false;

  midi: MidiConnector;

  constructor() {
    super();

    // @ts-ignore
    globalThis.console = new Logger(this);

    this.midi = new MidiConnector(this);

    globalThis.init = () => {
      this._isInitPhase = true;

      // call the session init callbacks
      this.emit('init');

      this._isInitPhase = false;
      this._isInitInitialized = true;
    };

    globalThis.flush = () => {
      this.emit('flush');
    };

    globalThis.exit = () => {
      this._isExitPhase = true;

      // call registered exit callbacks
      this.emit('exit');
    };
  }

  /** Check if bitwig is currently in it's init startup phase */
  get isInitPhase(): boolean {
    return this._isInitPhase;
  }

  get isExitPhase(): boolean {
    return this._isExitPhase;
  }

  get isInitialized(): boolean {
    return this._isInitInitialized;
  }
}
