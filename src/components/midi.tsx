import React from 'react';

// object pattern

export type MidiObjectPatternMSN = { msn: number };
export type MidiObjectPatternLSN = { lsn: number };

export type MidiObjectPatternByte =
  | number
  | MidiObjectPatternMSN
  | MidiObjectPatternLSN;

export type MidiObjectPattern<
  S extends MidiObjectPatternByte = MidiObjectPatternByte,
  D1 extends MidiObjectPatternByte = MidiObjectPatternByte,
  D2 extends MidiObjectPatternByte = MidiObjectPatternByte
> = { status?: S; data1?: D1; data2?: D2 };

// hex pattern

// prettier-ignore
type HexToIntegerStatusMSNMap = {
  '8': 0x8, '9': 0x9, 'A': 0xA, 'B': 0xB, 'C': 0xC, 'D': 0xD, 'E': 0xE, 'F': 0xF,
}

// prettier-ignore
type HexToIntegerDataMSNMap = {
  '0': 0x0, '1': 0x1, '2': 0x2, '3': 0x3, '4': 0x4, '5': 0x5, '6': 0x6, '7': 0x7,
}

// prettier-ignore
type HexToIntegerLSNMap = {
  '0': 0x0, '1': 0x1, '2': 0x2, '3': 0x3, '4': 0x4, '5': 0x5, '6': 0x6, '7': 0x7,
  '8': 0x8, '9': 0x9, 'A': 0xA, 'B': 0xB, 'C': 0xC, 'D': 0xD, 'E': 0xE, 'F': 0xF,
}

// prettier-ignore
type MidiStatusIntegerMap = {
  '80': 0x80, '81': 0x81, '82': 0x82, '83': 0x83, '84': 0x84, '85': 0x85, '86': 0x86, '87': 0x87, '88': 0x88, '89': 0x89, '8A': 0x8A, '8B': 0x8B, '8C': 0x8C, '8D': 0x8D, '8E': 0x8E, '8F': 0x8F,
  '90': 0x90, '91': 0x91, '92': 0x92, '93': 0x93, '94': 0x94, '95': 0x95, '96': 0x96, '97': 0x97, '98': 0x98, '99': 0x99, '9A': 0x9A, '9B': 0x9B, '9C': 0x9C, '9D': 0x9D, '9E': 0x9E, '9F': 0x9F,
  'A0': 0xA0, 'A1': 0xA1, 'A2': 0xA2, 'A3': 0xA3, 'A4': 0xA4, 'A5': 0xA5, 'A6': 0xA6, 'A7': 0xA7, 'A8': 0xA8, 'A9': 0xA9, 'AA': 0xAA, 'AB': 0xAB, 'AC': 0xAC, 'AD': 0xAD, 'AE': 0xAE, 'AF': 0xAF,
  'B0': 0xB0, 'B1': 0xB1, 'B2': 0xB2, 'B3': 0xB3, 'B4': 0xB4, 'B5': 0xB5, 'B6': 0xB6, 'B7': 0xB7, 'B8': 0xB8, 'B9': 0xB9, 'BA': 0xBA, 'BB': 0xBB, 'BC': 0xBC, 'BD': 0xBD, 'BE': 0xBE, 'BF': 0xBF,
  'C0': 0xC0, 'C1': 0xC1, 'C2': 0xC2, 'C3': 0xC3, 'C4': 0xC4, 'C5': 0xC5, 'C6': 0xC6, 'C7': 0xC7, 'C8': 0xC8, 'C9': 0xC9, 'CA': 0xCA, 'CB': 0xCB, 'CC': 0xCC, 'CD': 0xCD, 'CE': 0xCE, 'CF': 0xCF,
  'D0': 0xD0, 'D1': 0xD1, 'D2': 0xD2, 'D3': 0xD3, 'D4': 0xD4, 'D5': 0xD5, 'D6': 0xD6, 'D7': 0xD7, 'D8': 0xD8, 'D9': 0xD9, 'DA': 0xDA, 'DB': 0xDB, 'DC': 0xDC, 'DD': 0xDD, 'DE': 0xDE, 'DF': 0xDF,
  'E0': 0xE0, 'E1': 0xE1, 'E2': 0xE2, 'E3': 0xE3, 'E4': 0xE4, 'E5': 0xE5, 'E6': 0xE6, 'E7': 0xE7, 'E8': 0xE8, 'E9': 0xE9, 'EA': 0xEA, 'EB': 0xEB, 'EC': 0xEC, 'ED': 0xED, 'EE': 0xEE, 'EF': 0xEF,
  'F0': 0xF0, 'F1': 0xF1, 'F2': 0xF2, 'F3': 0xF3, 'F4': 0xF4, 'F5': 0xF5, 'F6': 0xF6, 'F7': 0xF7, 'F8': 0xF8, 'F9': 0xF9, 'FA': 0xFA, 'FB': 0xFB, 'FC': 0xFC, 'FD': 0xFD, 'FE': 0xFE, 'FF': 0xFF,
}

// prettier-ignore
type MidiDataIntegerMap = {
  '00': 0x00, '01': 0x01, '02': 0x02, '03': 0x03, '04': 0x04, '05': 0x05, '06': 0x06, '07': 0x07, '08': 0x08, '09': 0x09, '0A': 0x0A, '0B': 0x0B, '0C': 0x0C, '0D': 0x0D, '0E': 0x0E, '0F': 0x0F,
  '10': 0x10, '11': 0x11, '12': 0x12, '13': 0x13, '14': 0x14, '15': 0x15, '16': 0x16, '17': 0x17, '18': 0x18, '19': 0x19, '1A': 0x1A, '1B': 0x1B, '1C': 0x1C, '1D': 0x1D, '1E': 0x1E, '1F': 0x1F,
  '20': 0x20, '21': 0x21, '22': 0x22, '23': 0x23, '24': 0x24, '25': 0x25, '26': 0x26, '27': 0x27, '28': 0x28, '29': 0x29, '2A': 0x2A, '2B': 0x2B, '2C': 0x2C, '2D': 0x2D, '2E': 0x2E, '2F': 0x2F,
  '30': 0x30, '31': 0x31, '32': 0x32, '33': 0x33, '34': 0x34, '35': 0x35, '36': 0x36, '37': 0x37, '38': 0x38, '39': 0x39, '3A': 0x3A, '3B': 0x3B, '3C': 0x3C, '3D': 0x3D, '3E': 0x3E, '3F': 0x3F,
  '40': 0x40, '41': 0x41, '42': 0x42, '43': 0x43, '44': 0x44, '45': 0x45, '46': 0x46, '47': 0x47, '48': 0x48, '49': 0x49, '4A': 0x4A, '4B': 0x4B, '4C': 0x4C, '4D': 0x4D, '4E': 0x4E, '4F': 0x4F,
  '50': 0x50, '51': 0x51, '52': 0x52, '53': 0x53, '54': 0x54, '55': 0x55, '56': 0x56, '57': 0x57, '58': 0x58, '59': 0x59, '5A': 0x5A, '5B': 0x5B, '5C': 0x5C, '5D': 0x5D, '5E': 0x5E, '5F': 0x5F,
  '60': 0x60, '61': 0x61, '62': 0x62, '63': 0x63, '64': 0x64, '65': 0x65, '66': 0x66, '67': 0x67, '68': 0x68, '69': 0x69, '6A': 0x6A, '6B': 0x6B, '6C': 0x6C, '6D': 0x6D, '6E': 0x6E, '6F': 0x6F,
  '70': 0x70, '71': 0x71, '72': 0x72, '73': 0x73, '74': 0x74, '75': 0x75, '76': 0x76, '77': 0x77, '78': 0x78, '79': 0x79, '7A': 0x7A, '7B': 0x7B, '7C': 0x7C, '7D': 0x7D, '7E': 0x7E, '7F': 0x7F,
}

export type StatusHexPatternByte = `${keyof HexToIntegerStatusMSNMap | '?'}${
  | keyof HexToIntegerLSNMap
  | '?'}`;
export type DataHexPatternByte = `${keyof HexToIntegerDataMSNMap | '?'}${
  | keyof HexToIntegerLSNMap
  | '?'}`;

type MidiHexToObjectPatternByte<
  B extends StatusHexPatternByte | DataHexPatternByte
> = B extends `${infer MSN}${infer LSN}`
  ? B extends keyof MidiStatusIntegerMap
    ? MidiStatusIntegerMap[B]
    : B extends keyof MidiDataIntegerMap
    ? MidiDataIntegerMap[B]
    : MSN extends keyof HexToIntegerStatusMSNMap
    ? LSN extends keyof HexToIntegerLSNMap
      ? never
      : { msn: HexToIntegerStatusMSNMap[MSN] }
    : MSN extends keyof HexToIntegerDataMSNMap
    ? LSN extends keyof HexToIntegerLSNMap
      ? never
      : { msn: HexToIntegerDataMSNMap[MSN] }
    : LSN extends keyof HexToIntegerLSNMap
    ? { lsn: HexToIntegerLSNMap[LSN] }
    : never
  : never;

type MidiHexBytesToObjectPattern<
  S extends StatusHexPatternByte,
  D1 extends DataHexPatternByte,
  D2 extends DataHexPatternByte
> = MidiHexToObjectPatternByte<S> extends undefined
  ? MidiHexToObjectPatternByte<D1> extends undefined
    ? MidiHexToObjectPatternByte<D2> extends undefined
      ? {}
      : { data2: MidiHexToObjectPatternByte<D2> }
    : MidiHexToObjectPatternByte<D2> extends undefined
    ? { data1: MidiHexToObjectPatternByte<D1> }
    : {
        data1: MidiHexToObjectPatternByte<D1>;
        data2: MidiHexToObjectPatternByte<D2>;
      }
  : MidiHexToObjectPatternByte<D1> extends undefined
  ? MidiHexToObjectPatternByte<D2> extends undefined
    ? { status: MidiHexToObjectPatternByte<S> }
    : {
        status: MidiHexToObjectPatternByte<S>;
        data2: MidiHexToObjectPatternByte<D2>;
      }
  : MidiHexToObjectPatternByte<D2> extends undefined
  ? {
      status: MidiHexToObjectPatternByte<S>;
      data1: MidiHexToObjectPatternByte<D1>;
    }
  : {
      status: MidiHexToObjectPatternByte<S>;
      data1: MidiHexToObjectPatternByte<D1>;
      data2: MidiHexToObjectPatternByte<D2>;
    };

export type MidiHexPattern = string;

type HexPatternToObjectPattern<T extends MidiHexPattern> =
  T extends `${infer P0}${infer P1}${infer P2}${infer P3}${infer P4}${infer P5}${infer REST}`
    ? `${P0}${P1}` extends StatusHexPatternByte
      ? `${P2}${P3}` extends DataHexPatternByte
        ? `${P4}${P5}` extends DataHexPatternByte
          ? '' extends REST // should be only 6 character long
            ? MidiHexBytesToObjectPattern<
                `${P0}${P1}`,
                `${P2}${P3}`,
                `${P4}${P5}`
              >
            : {}
          : {}
        : {}
      : {}
    : {};

type MidiPattern<T extends MidiObjectPattern | MidiHexPattern> =
  T extends MidiHexPattern ? HexPatternToObjectPattern<T> : T;

type FilterFlags<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never;
};
type AllowedNames<Base, Condition> = FilterFlags<Base, Condition>[keyof Base];
type SubType<Base, Condition> = Omit<Base, AllowedNames<Base, Condition>>;

type Value<T extends MidiObjectPattern> = SubType<
  {
    [K in keyof Required<MidiObjectPattern>]: T[K] extends MidiObjectPatternMSN
      ? MidiObjectPatternLSN
      : T[K] extends MidiObjectPatternLSN
      ? MidiObjectPatternMSN
      : T[K] extends number
      ? never
      : Extract<keyof T, K> extends never
      ? number
      : MidiObjectPatternByte;
  },
  never
>;

type Input<T extends MidiObjectPattern> = {
  [K in keyof Required<MidiObjectPattern>]: T[K] extends MidiObjectPatternMSN
    ? number
    : T[K] extends MidiObjectPatternLSN
    ? number
    : T[K] extends number
    ? T[K]
    : number;
};

export type MidiProps = {
  label?: string;
  port?: number;
  pattern?: MidiHexPattern | MidiObjectPattern;
  value?: MidiObjectPattern;
  unmountValue?: MidiObjectPattern;
  onInput?: (message: MidiObjectPattern) => void;
  onChange?: (message: MidiObjectPattern) => void;
  cacheOnInput?: boolean;
  cacheOnOutput?: boolean;
  urgent?: boolean;
};

export type InternalMidiProps = {
  sysex: false;
  label?: string;
  port?: number;
  pattern?: MidiHexPattern | MidiObjectPattern;
  defaultValue?: MidiObjectPattern;
  value?: MidiObjectPattern;
  unmountValue?: MidiObjectPattern;
  onInput?: (message: MidiObjectPattern) => void;
  onChange?: (message: MidiObjectPattern) => void;
  cacheOnInput?: boolean;
  cacheOnOutput?: boolean;
  urgent?: boolean;
};

export type GenericMidiProps<
  T extends MidiObjectPattern | MidiHexPattern = {}
> = {
  label?: string;
  port?: number;
  pattern?: T;
  defaultValue?: {
    [K in keyof Value<MidiPattern<T>>]: Value<MidiPattern<T>>[K];
  };
  value?: { [K in keyof Value<MidiPattern<T>>]: Value<MidiPattern<T>>[K] };
  unmountValue?: {
    [K in keyof Value<MidiPattern<T>>]: Value<MidiPattern<T>>[K];
  };
  onInput?: (message: {
    [K in keyof Input<MidiPattern<T>>]: Input<MidiPattern<T>>[K];
  }) => void;
  onChange?: (message: {
    [K in keyof Input<MidiPattern<T>>]: Input<MidiPattern<T>>[K];
  }) => void;
  cacheOnInput?: boolean;
  cacheOnOutput?: boolean;
  urgent?: boolean;
};

export const Midi = <T extends MidiObjectPattern | MidiHexPattern>(
  props: GenericMidiProps<T>
) => React.createElement('midi', { sysex: false, ...props });

type MidiExtension<P = {}> = Omit<
  MidiProps,
  'pattern' | 'value' | 'unmountValue' | 'onInput' | 'onChange'
> & {
  channel: number;
  value?: number;
  unmountValue?: number;
  onInput?: (value: number) => void;
  onChange?: (value: number) => void;
} & P;

Midi.NoteOn = ({
  channel,
  note,
  value,
  unmountValue,
  onInput,
  onChange,
  ...rest
}: MidiExtension<{ note: number }>) => (
  <Midi
    pattern={{ status: 0x90 | channel, data1: note }}
    value={value !== undefined ? { data2: value } : undefined}
    unmountValue={
      unmountValue !== undefined ? { data2: unmountValue } : undefined
    }
    onInput={onInput ? ({ data2 }) => onInput(data2) : undefined}
    onChange={onChange ? ({ data2 }) => onChange(data2) : undefined}
    {...rest}
  />
);

Midi.NoteOff = ({
  channel,
  note,
  value,
  unmountValue,
  onInput,
  onChange,
  ...rest
}: MidiExtension<{ note: number }>) => (
  <Midi
    pattern={{ status: 0x80 | channel, data1: note }}
    value={value !== undefined ? { data2: value } : undefined}
    unmountValue={
      unmountValue !== undefined ? { data2: unmountValue } : undefined
    }
    onInput={onInput ? ({ data2 }) => onInput(data2) : undefined}
    onChange={onChange ? ({ data2 }) => onChange(data2) : undefined}
    {...rest}
  />
);

Midi.KeyPressure = ({
  channel,
  note,
  value,
  unmountValue,
  onInput,
  onChange,
  ...rest
}: MidiExtension<{ note: number }>) => (
  <Midi
    pattern={{ status: 0xa0 | channel, data1: note }}
    value={value !== undefined ? { data2: value } : undefined}
    unmountValue={
      unmountValue !== undefined ? { data2: unmountValue } : undefined
    }
    onInput={onInput ? ({ data2 }) => onInput(data2) : undefined}
    onChange={onChange ? ({ data2 }) => onChange(data2) : undefined}
    {...rest}
  />
);

Midi.CC = ({
  channel,
  control,
  value,
  unmountValue,
  onInput,
  onChange,
  ...rest
}: MidiExtension<{ control: number }>) => (
  <Midi
    pattern={{ status: 0xb0 | channel, data1: control }}
    value={value !== undefined ? { data2: value } : undefined}
    unmountValue={
      unmountValue !== undefined ? { data2: unmountValue } : undefined
    }
    onInput={onInput ? ({ data2 }) => onInput(data2) : undefined}
    onChange={onChange ? ({ data2 }) => onChange(data2) : undefined}
    {...rest}
  />
);

Midi.ProgramChange = ({
  channel,
  program,
  value,
  unmountValue,
  onInput,
  onChange,
  ...rest
}: MidiExtension<{ program: number }>) => (
  <Midi
    pattern={{ status: 0xc0 | channel, data2: 0 }}
    value={value !== undefined ? { data1: value } : undefined}
    unmountValue={
      unmountValue !== undefined ? { data1: unmountValue } : undefined
    }
    onInput={onInput ? ({ data1 }) => onInput(data1) : undefined}
    onChange={onChange ? ({ data1 }) => onChange(data1) : undefined}
    {...rest}
  />
);

Midi.ChannelPressure = ({
  channel,
  value,
  unmountValue,
  onInput,
  onChange,
  ...rest
}: MidiExtension) => (
  <Midi
    pattern={{ status: 0xd0 | channel, data2: 0x0 }}
    value={value !== undefined ? { data1: value } : undefined}
    unmountValue={
      unmountValue !== undefined ? { data1: unmountValue } : undefined
    }
    onInput={onInput ? ({ data2 }) => onInput(data2) : undefined}
    onChange={onChange ? ({ data2 }) => onChange(data2) : undefined}
    {...rest}
  />
);

Midi.PitchBend = ({
  channel,
  value,
  unmountValue,
  onInput,
  onChange,
  ...rest
}: MidiExtension) => (
  <Midi
    pattern={{ status: 0xe0 | channel }}
    value={
      value !== undefined
        ? { data1: value & 0x7f, data2: (value >> 7) & 0x7f }
        : undefined
    }
    unmountValue={
      value !== undefined
        ? { data1: value & 0x7f, data2: (value >> 7) & 0x7f }
        : undefined
    }
    onInput={
      onInput ? ({ data1, data2 }) => onInput(128 * data2 + data1) : undefined
    }
    onChange={
      onChange ? ({ data1, data2 }) => onChange(128 * data2 + data1) : undefined
    }
    {...rest}
  />
);

export type SysexProps = {
  label?: string;
  port?: number;
  pattern?: string;
  defaultValue?: string;
  value?: string;
  unmountValue?: string;
  onInput?: (data: string) => void;
  onChange?: (data: string) => void;
  cacheOnInput?: boolean;
  cacheOnOutput?: boolean;
  urgent?: boolean;
};

Midi.Sysex = (props: SysexProps) =>
  React.createElement('midi', { sysex: true, ...props });
