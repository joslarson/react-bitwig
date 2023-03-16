import { MidiHexPattern, MidiObjectPattern } from '../../components/midi';
import { ControlInstanceBase } from '../base';
import { MidiInstanceUpdatePayload, MidiConnector } from './midi-connector';

export type MidiInstanceProps = (
  | {
      sysex: true;
      label?: string;
      port?: number;
      pattern?: string;
      defaultValue?: string;
      value?: string;
      unmountValue?: string;
    }
  | {
      sysex: false;
      label?: string;
      port?: number;
      pattern?: MidiHexPattern | MidiObjectPattern;
      defaultValue?: MidiObjectPattern;
      value?: MidiObjectPattern;
      unmountValue?: MidiObjectPattern;
    }
) & {
  onInput?: (message: MidiObjectPattern | string) => void;
  onChange?: (message: MidiObjectPattern | string) => void;
  cacheOnInput?: boolean;
  cacheOnOutput?: boolean;
  urgent?: boolean;
};

export class MidiInstance extends ControlInstanceBase<
  MidiInstanceProps,
  MidiInstanceUpdatePayload
> {
  // connector is null until control has been added to the session
  connector: MidiConnector | null = null;

  commitUpdate(
    updatePayload: MidiInstanceUpdatePayload,
    oldProps: MidiInstanceProps,
    newProps: MidiInstanceProps
  ) {
    this.connector?.commitInstanceUpdate(
      this,
      updatePayload,
      oldProps,
      newProps
    );
  }
}
