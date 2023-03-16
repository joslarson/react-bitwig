import { MidiMessage, SimpleMidiMessage } from './midi-message';
import { Session } from '../../session';

export interface NaiveMidiMessage extends SimpleMidiMessage {
  label?: string;
  port: number;
}

export interface NaiveSysexMessage {
  label?: string;
  port: number;
  data: string;
}

export class MidiOutProxy {
  private session: Session;
  private _midiQueue: NaiveMidiMessage[] = [];
  private _sysexQueue: NaiveSysexMessage[] = [];

  constructor(session: Session) {
    this.session = session;
    session.on('flush', () => this._flushQueues());
  }

  sendMidi({
    label,
    port = 0,
    status,
    data1,
    data2,
    urgent = false,
  }: {
    label?: string;
    port?: number;
    status: number;
    data1: number;
    data2: number;
    urgent?: boolean;
  }) {
    // if urgent, fire midi message immediately, otherwise queue it up for next flush
    if (urgent || this.session.isExitPhase) {
      console.log(
        `[MIDI]  OUT ${port} <== ${
          new MidiMessage({ status, data1, data2 }).shortHex
        }${label ? ` "${label}"` : ''}`
      );
      host.getMidiOutPort(port).sendMidi(status, data1, data2);
    } else {
      this._midiQueue.push({ label, port, status, data1, data2 });
    }
  }

  sendSysex({
    label,
    port = 0,
    data,
    urgent = false,
  }: {
    label?: string;
    port?: number;
    data: string;
    urgent?: boolean;
  }) {
    // if urgent, fire sysex immediately, otherwise queue it up for next flush
    if (urgent) {
      console.log(
        `[SYSEX] OUT ${port} <== ${data}${label ? ` "${label}"` : ''}`
      );
      host.getMidiOutPort(port).sendSysex(data);
    } else {
      this._sysexQueue.push({ label, port, data });
    }
  }

  sendNoteOn({
    port = 0,
    channel,
    key,
    velocity,
    urgent = false,
  }: {
    port?: number;
    channel: number;
    key: number;
    velocity: number;
    urgent?: boolean;
  }) {
    this.sendMidi({
      urgent,
      port,
      status: 0x90 | channel,
      data1: key,
      data2: velocity,
    });
  }

  sendNoteOff({
    port = 0,
    channel,
    key,
    velocity,
    urgent = false,
  }: {
    port?: number;
    channel: number;
    key: number;
    velocity: number;
    urgent?: boolean;
  }) {
    this.sendMidi({
      urgent,
      port,
      status: 0x80 | channel,
      data1: key,
      data2: velocity,
    });
  }

  sendKeyPressure({
    port = 0,
    channel,
    key,
    pressure,
    urgent = false,
  }: {
    port?: number;
    channel: number;
    key: number;
    pressure: number;
    urgent?: boolean;
  }) {
    this.sendMidi({
      urgent,
      port,
      status: 0xa0 | channel,
      data1: key,
      data2: pressure,
    });
  }

  sendControlChange({
    port = 0,
    channel,
    control,
    value,
    urgent = false,
  }: {
    port?: number;
    channel: number;
    control: number;
    value: number;
    urgent?: boolean;
  }) {
    this.sendMidi({
      urgent,
      port,
      status: 0xb0 | channel,
      data1: control,
      data2: value,
    });
  }

  sendProgramChange({
    port = 0,
    channel,
    program,
    urgent = false,
  }: {
    port?: number;
    channel: number;
    program: number;
    urgent?: boolean;
  }) {
    this.sendMidi({
      urgent,
      port,
      status: 0xc0 | channel,
      data1: program,
      data2: 0,
    });
  }

  sendChannelPressure({
    port = 0,
    channel,
    pressure,
    urgent = false,
  }: {
    port?: number;
    channel: number;
    pressure: number;
    urgent?: boolean;
  }) {
    this.sendMidi({
      urgent,
      port,
      status: 0xd0 | channel,
      data1: pressure,
      data2: 0,
    });
  }

  sendPitchBend({
    port = 0,
    channel,
    value,
    urgent = false,
  }: {
    port?: number;
    channel: number;
    value: number;
    urgent?: boolean;
  }) {
    this.sendMidi({
      urgent,
      port,
      status: 0xe0 | channel,
      data1: value & 0x7f,
      data2: (value >> 7) & 0x7f,
    });
  }

  // flush queued midi and sysex messages
  protected _flushQueues() {
    while (this._midiQueue.length > 0 || this._sysexQueue.length > 0) {
      const midiMessage = this._midiQueue.shift() as NaiveMidiMessage;
      if (midiMessage) {
        const { label, port, status, data1, data2 } = midiMessage;
        console.log(
          `[MIDI]  OUT ${port} <== ${
            new MidiMessage({ status, data1, data2 }).shortHex
          }${label ? ` "${label}"` : ''}`
        );
        host.getMidiOutPort(port).sendMidi(status, data1, data2);
      }

      const sysexMessage = this._sysexQueue.shift() as NaiveSysexMessage;
      if (sysexMessage) {
        const { label, port, data } = sysexMessage;
        console.log(
          `[SYSEX] OUT ${port} <== ${label ? `"${label}" ` : ''}${data}`
        );
        host.getMidiOutPort(port).sendSysex(data);
      }
    }
  }
}
