import {
  DataHexPatternByte,
  MidiObjectPattern,
  MidiObjectPatternByte,
  StatusHexPatternByte,
} from '../../components/midi';
import { MidiInstance, MidiInstanceProps } from './midi-instance';
import { deepEqual } from './utils';

function isStatusHexPatternByte(byte: string): byte is StatusHexPatternByte {
  return /^[8-9A-F?][0-9A-F?]$/.test(byte);
}

function isDataHexPatternByte(byte: string): byte is DataHexPatternByte {
  return /^[0-7?][0-9A-F?]$/.test(byte);
}

function hexToObjectPatternByte(
  byte: StatusHexPatternByte | DataHexPatternByte
): MidiObjectPatternByte | undefined {
  if (/^[0-9A-F]{2,}$/.test(byte)) {
    return parseInt(byte, 16);
  } else if (/^[0-9A-F]\?$/.test(byte)) {
    return { msn: parseInt(byte[0], 16) };
  } else if (/^\?[0-9A-F]$/.test(byte)) {
    return { lsn: parseInt(byte[1], 16) };
  } else if (/^\?\?$/.test(byte)) {
    return undefined;
  } else {
    throw new Error(`Invalid hex pattern byte: "${byte}"`);
  }
}

function hexToObjectPattern(hexPattern: string): MidiObjectPattern {
  if (hexPattern.length !== 6) {
    throw new Error(`Invalid hex pattern length (> 6): "${hexPattern}"`);
  }

  const result: MidiObjectPattern = {};

  const statusByte = hexPattern.slice(0, 2);
  const data1Byte = hexPattern.slice(2, 4);
  const data2Byte = hexPattern.slice(4, 6);

  if (
    !isStatusHexPatternByte(statusByte) ||
    !isDataHexPatternByte(data1Byte) ||
    !isDataHexPatternByte(data2Byte)
  ) {
    throw new Error(`Invalid hex pattern: "${hexPattern}"`);
  }

  const status = hexToObjectPatternByte(statusByte);
  if (status) result.status = status;

  const data1 = hexToObjectPatternByte(data1Byte);
  if (data1) result.data1 = data1;

  const data2 = hexToObjectPatternByte(data2Byte);
  if (data2) result.data2 = data2;

  return result;
}

const getPatternStringFromMidiMessage = (
  message: { port?: number } & (MidiObjectPattern | { data: string })
) => {
  if ('data' in message) {
    const { port = 0, data } = message;
    return `${port.toString(16).toUpperCase()}${data}`;
  } else {
    const { port = 0, status, data1, data2 } = message;
    return [port, status, data1, data2]
      .map((byte) => {
        if (byte === undefined) {
          return '??';
        } else if (typeof byte === 'number') {
          let hexByteString = byte.toString(16).toUpperCase();
          if (hexByteString.length === 1) hexByteString = `0${hexByteString}`;
          return hexByteString;
        } else {
          return `${'msn' in byte ? byte.msn.toString(16) : '?'}${
            'lsn' in byte ? byte.lsn.toString(16) : '?'
          }`;
        }
      })
      .join('');
  }
};

export class MidiNode {
  sysex: boolean;
  label?: string;
  port?: number;
  pattern?: MidiObjectPattern;

  cacheOnInput: boolean;
  cacheOnOutput: boolean;
  cachedValue?:
    | {
        port: number;
        status: number;
        data1: number;
        data2: number;
      }
    | { port: number; data: string };

  string: string;
  regex: RegExp;

  instances: MidiInstance[] = [];

  constructor({
    port = 0,
    sysex,
    pattern,
    value,
    cacheOnInput,
    cacheOnOutput,
  }: MidiInstanceProps) {
    this.sysex = sysex;
    this.port = port;
    this.cacheOnInput = !!cacheOnInput;
    this.cacheOnOutput = !!cacheOnOutput;

    if (sysex) {
      if (pattern) {
        if (typeof pattern !== 'string') {
          throw new Error('Invalid sysex MidiNode');
        }
        this.string = getPatternStringFromMidiMessage({ port, data: pattern });
      } else if (value) {
        this.string = getPatternStringFromMidiMessage({ port, data: value });
      } else {
        throw new Error('MidiNode should have a pattern or a value.');
      }
    } else if (pattern) {
      // convert string pattern to object pattern
      if (typeof pattern === 'string') {
        pattern = hexToObjectPattern(pattern);
      }

      this.pattern = pattern;

      this.string = getPatternStringFromMidiMessage({
        port,
        ...pattern,
      });
    } else if (value) {
      this.pattern = value;
      this.string = getPatternStringFromMidiMessage({
        port,
        ...value,
      });
    } else {
      throw new Error('MidiNode should have a pattern or a value.');
    }

    this.regex = new RegExp(`^${this.string.slice().replace(/\?/g, '.')}$`);
  }

  toString() {
    return this.string;
  }

  conflictsWith({ string: stringB, regex: regexB }: MidiNode) {
    const { string: stringA, regex: regexA } = this;
    return regexA.test(stringB) || regexB.test(stringA);
  }

  test(
    message:
      | {
          port?: number;
          status: number;
          data1: number;
          data2: number;
        }
      | {
          port?: number;
          data: string;
        }
  ) {
    const testString = getPatternStringFromMidiMessage(message);

    return this.regex.test(testString);
  }

  handleCachedValueChange() {
    this.instances.forEach((instance) => {
      if (this.cachedValue && instance.props.onChange) {
        instance.props.onChange(
          'data' in this.cachedValue ? this.cachedValue.data : this.cachedValue
        );
      }
    });
  }

  onIO(
    type: 'input' | 'output',
    {
      port = 0,
      ...rest
    }:
      | {
          port?: number;
          status: number;
          data1: number;
          data2: number;
        }
      | { port?: number; data: string }
  ) {
    let message:
      | {
          port: number;
          status: number;
          data1: number;
          data2: number;
        }
      | { port: number; data: string };
    if ('data' in rest) {
      message = {
        port,
        data: rest.data,
      };
    } else {
      message = {
        port,
        status: rest.status,
        data1: rest.data1,
        data2: rest.data2,
      };
    }

    let shouldUpdateCache = false;
    if (
      (type === 'input' && this.cacheOnInput) ||
      (type === 'output' && this.cacheOnOutput)
    ) {
      shouldUpdateCache = !deepEqual(message, this.cachedValue);
    }

    if (shouldUpdateCache) {
      this.cachedValue = message;
      [...this.instances].forEach((instance) => {
        if (
          this.cachedValue &&
          instance.props.onChange &&
          this.instances.includes(instance)
        ) {
          instance.props.onChange('data' in message ? message.data : message);
        }
      });
    }
  }

  shouldOutputMessage({
    port = 0,
    ...rest
  }:
    | {
        port?: number;
        status: number;
        data1: number;
        data2: number;
      }
    | { port?: number; data: string }) {
    let message:
      | {
          port: number;
          status: number;
          data1: number;
          data2: number;
        }
      | { port: number; data: string };

    if ('data' in rest) {
      message = {
        port,
        data: rest.data,
      };
    } else {
      message = {
        port,
        status: rest.status,
        data1: rest.data1,
        data2: rest.data2,
      };
    }

    return !deepEqual(message, this.cachedValue);
  }
}
