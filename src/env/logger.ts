import { Session } from '../session';

export type Level = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
export type MidiLevel = 'Input' | 'Output' | 'Both' | 'None';

/**
 * Simple logger implementation including integration with the Bitwig
 * API's preferences system for setting log level, log filtering via
 * regular expressions, and Midi I/O filtering.
 */
export class Logger {
  private _levels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
  private _level!: Level;
  private _midiLevel!: MidiLevel;
  private _levelSetting!: API.SettableEnumValue;
  private _filter!: string;
  private _filterSetting!: API.SettableStringValue;
  private _initQueue: [Level | null, any[]][] = [];
  private _flushed = false;

  constructor(session?: Session) {
    session?.on('init', () => {
      host
        .getPreferences()
        .getEnumSetting(
          'Log Midi',
          'Development',
          ['None', 'Input', 'Output', 'Both'],
          'None'
        )
        .addValueObserver((midiLevel) => {
          this._midiLevel = midiLevel as MidiLevel;
          if (this._ready && !this._flushed) this._flushQueue();
        });

      this._levelSetting = host
        .getPreferences()
        .getEnumSetting('Log Level', 'Development', this._levels, 'ERROR');

      this._levelSetting.addValueObserver((level) => {
        this._level = level as Level;
        if (this._ready && !this._flushed) this._flushQueue();
      });

      this._filterSetting = host
        .getPreferences()
        .getStringSetting('Log filter (Regex)', 'Development', 1000, '');
      this._filterSetting.addValueObserver((value) => {
        this._filter = value;
        if (this._filter) {
          const message = ` Log filter regex set to "${value}"`;
          this.log(`╭───┬${'─'.repeat(message.length)}╮`);
          this.log(`│ i │${message}` +               '│'); // prettier-ignore
          this.log(`╰───┴${'─'.repeat(message.length)}╯`);
        }
        if (this._ready && !this._flushed) this._flushQueue();
      });
    });
  }

  private get _ready() {
    return (
      this._filter !== undefined &&
      this._level !== undefined &&
      this._midiLevel !== undefined
    );
  }

  set level(level: Level) {
    if (this._levelSetting !== undefined) {
      this._levelSetting.set(level);
    } else {
      this._level = level;
    }
  }

  get level() {
    return this._level;
  }

  set filter(value) {
    if (this._filterSetting !== undefined) {
      this._filterSetting.set(value);
    } else {
      this._filter = value;
    }
  }

  get filter() {
    return this._filter;
  }

  log(...messages: any[]) {
    this._log(null, ...messages);
  }

  error(...messages: any[]) {
    this._log('ERROR', ...messages);
  }

  warn(...messages: any[]) {
    this._log('WARN', ...messages);
  }

  info(...messages: any[]) {
    this._log('INFO', ...messages);
  }

  debug(...messages: any[]) {
    this._log('DEBUG', ...messages);
  }

  dir(...messages: any[]) {
    this._log(null, ...messages.map((m) => JSON.stringify(m, null, 2)));
  }

  private _log(level: Level | null, ...messages: any[]) {
    if (!this._ready) {
      this._initQueue.push([level, messages]);
      return;
    }

    if (
      level &&
      this._levels.indexOf(level) > this._levels.indexOf(this._level)
    )
      return;

    const message = `${level ? `[${level.toUpperCase()}] ` : ''}${messages.join(
      ' '
    )}`;
    if (level && this._filter) {
      const re = new RegExp(this._filter, 'gi');
      if (!re.test(message)) return;
    }

    const isMidiInput = new RegExp('^\\[(MIDI|SYSEX)\\] ? IN', 'gi').test(
      message
    );
    const isMidiOutput = new RegExp('^\\[(MIDI|SYSEX)\\] ? OUT', 'gi').test(
      message
    );

    if (this._midiLevel === 'None' && (isMidiInput || isMidiOutput)) return;
    if (this._midiLevel === 'Input' && isMidiOutput) return;
    if (this._midiLevel === 'Output' && isMidiInput) return;

    level === 'ERROR' ? host.errorln(message) : host.println(message);
  }

  private _flushQueue() {
    while (this._initQueue.length > 0) {
      const [level, messages] = this._initQueue.shift() as [
        Level | null,
        any[]
      ];
      this._log(level, ...messages);
    }
    this._flushed = true;
  }
}
