import { Session } from '../../session';
import { ControlConnectorBase } from '../base';
import { deepEqual } from './utils';
import { MidiInstance } from './midi-instance';
import { MidiMessage } from './midi-message';
import { MidiNode } from './midi-node';
import { MidiOutProxy } from './midi-out-proxy';
import { SysexMessage } from './sysex-message';
import { MidiObjectPatternByte } from '../../components/midi';

export type MidiInstanceUpdatePayload = null | {
  midiNodeToConnect: MidiNode | null;
  midiOutput:
    | {
        label?: string;
        status: number;
        data1: number;
        data2: number;
      }
    | {
        label?: string;
        data: string;
      }
    | null;
  inputHandlerChanged: boolean;
};

const getMidiMessageByteFromPatternAndValueBytes = (
  patternByte?: MidiObjectPatternByte,
  valueByte?: MidiObjectPatternByte
): number => {
  if (typeof patternByte === 'number') {
    return patternByte;
  } else if (typeof valueByte === 'number') {
    return valueByte;
  } else if (
    patternByte &&
    valueByte &&
    'msn' in patternByte &&
    'lsn' in valueByte
  ) {
    return patternByte.msn * 16 + valueByte.lsn;
  } else if (
    patternByte &&
    valueByte &&
    'msn' in valueByte &&
    'lsn' in patternByte
  ) {
    return valueByte.msn * 16 + patternByte.lsn;
  } else {
    throw new Error(
      'Something went wrong here. This error should never be reached because Midi match patterns and values should be complimentary and produce a full midi message when both exist'
    );
  }
};

const getMidiOutput = ({
  midiNode,
  value,
  label,
}: {
  midiNode?: MidiNode;
  value?: MidiInstance['props']['value'];
  label?: string;
}) => {
  let result: NonNullable<MidiInstanceUpdatePayload>['midiOutput'] = null;
  if (value) {
    if (midiNode) {
      let output:
        | {
            label?: string;
            port?: number | undefined;
            status: number;
            data1: number;
            data2: number;
          }
        | {
            label?: string;
            port?: number | undefined;
            data: string;
          };

      if (typeof value === 'string') {
        output = {
          label,
          port: midiNode.port,
          data: value,
        };
      } else {
        output = {
          label,
          port: midiNode.port,
          status: getMidiMessageByteFromPatternAndValueBytes(
            midiNode.pattern?.status,
            value.status
          ),
          data1: getMidiMessageByteFromPatternAndValueBytes(
            midiNode.pattern?.data1,
            value.data1
          ),
          data2: getMidiMessageByteFromPatternAndValueBytes(
            midiNode.pattern?.data2,
            value.data2
          ),
        };
      }

      if (midiNode.shouldOutputMessage(output)) {
        result = output;
      }
    }
  }
  return result;
};

export class MidiConnector extends ControlConnectorBase<MidiInstance> {
  activeMidiNodes = new Set<MidiNode>();
  midiNodeMap = new Map<MidiInstance, MidiNode>();

  midiOut: MidiOutProxy;

  constructor(session: Session) {
    super(session);
    // midi output
    this.midiOut = new MidiOutProxy(session);
    // midi input
    session.on('init', () => {
      const midiInPorts = this.midiInPorts;
      for (let port = 0; port < midiInPorts.length; port += 1) {
        midiInPorts[port].setMidiCallback(
          (status: number, data1: number, data2: number) => {
            this.handleMidiInput(
              new MidiMessage({ port, status, data1, data2 })
            );
          }
        );
        midiInPorts[port].setSysexCallback((data: string) => {
          this.handleMidiInput(new SysexMessage({ port, data }));
        });
      }
    });
    // cleanup on exit
    session.on('exit', () => this.clearInstances());
  }

  private disconnectInstanceFromNode(
    instance: MidiInstance,
    synchronous?: boolean
  ) {
    const midiNode = this.midiNodeMap.get(instance);
    if (midiNode) {
      // remove from midiNodes and midiNodeMap
      midiNode.instances.splice(midiNode.instances.indexOf(instance), 1);
      this.midiNodeMap.delete(instance);
      // send unmount value if no instances using node
      if (midiNode.instances.length === 0) {
        const unmountOutput = getMidiOutput({
          label: instance.props.label,
          midiNode,
          value: instance.props.unmountValue,
        });
        if (unmountOutput) {
          const sendUnmountOutput = () => {
            // for async, check if node instances are still 0
            if (midiNode.instances.length === 0) {
              if ('data' in unmountOutput) {
                this.midiOut.sendSysex(unmountOutput);
              } else {
                this.midiOut.sendMidi(unmountOutput);
              }
              midiNode.onIO('output', unmountOutput);
            }
          };

          if (synchronous) {
            // synchronous unmount is use on exit, otherwise will exit before async is called
            sendUnmountOutput();
          } else {
            // allows replacement instances (if any) to connect so we don't send unmount messages unnecessarily
            setTimeout(sendUnmountOutput, 0);
          }
        }
      }
    }
  }

  private connectInstanceToNode(instance: MidiInstance, midiNode: MidiNode) {
    const existingMidiNode = this.midiNodeMap.get(instance);
    // no change? early exit
    if (midiNode === existingMidiNode) return;
    // is change and has existing node? disconnect from existing node
    if (existingMidiNode) this.disconnectInstanceFromNode(instance);
    // update instance ref on node
    if (!midiNode.instances.includes(instance)) {
      midiNode.instances.push(instance);
    }
    // update midiNodeMap
    this.midiNodeMap.set(instance, midiNode);
    // update midiNodes list
    if (!this.activeMidiNodes.has(midiNode)) {
      this.activeMidiNodes.add(midiNode);
    }
  }

  addInstance(instance: MidiInstance): void {
    if (!this.instances.includes(instance)) {
      this.instances.push(instance);
      instance.connector = this;

      this.commitInstanceUpdate(
        instance,
        this.prepareInstanceUpdate(
          instance,
          instance.props,
          instance.props,
          true
        ),
        instance.props,
        instance.props
      );
    }
  }

  prepareInstanceUpdate(
    instance: MidiInstance,
    oldProps: MidiInstance['props'],
    newProps: MidiInstance['props'],
    isMount?: boolean
  ): MidiInstanceUpdatePayload {
    let isMidiNodeNew = false;
    let midiNodeToConnect: MidiNode | null = null;
    // handle modified pattern
    if (
      isMount ||
      newProps.port !== oldProps.port ||
      !deepEqual(newProps.pattern, oldProps.pattern)
    ) {
      // create new node
      let midiNodeForNewProps = new MidiNode(newProps);
      const currentMidiNode = this.midiNodeMap.get(instance);
      if (
        !currentMidiNode ||
        midiNodeForNewProps.string !== currentMidiNode.string ||
        midiNodeForNewProps.cacheOnInput !== currentMidiNode.cacheOnInput ||
        midiNodeForNewProps.cacheOnOutput !== currentMidiNode.cacheOnOutput
        // TODO: check unmountValue is consistent here as well (needs to be added to MidiNode)
      ) {
        // check for existing conflicting node
        for (const existingMidiNode of this.activeMidiNodes) {
          if (midiNodeForNewProps.conflictsWith(existingMidiNode)) {
            if (
              midiNodeForNewProps.string === existingMidiNode.string &&
              midiNodeForNewProps.cacheOnInput ===
                existingMidiNode.cacheOnInput &&
              midiNodeForNewProps.cacheOnOutput ===
                existingMidiNode.cacheOnOutput
            ) {
              midiNodeToConnect = existingMidiNode;
              break;
            } else {
              throw new Error(
                `MidiNode conflicts with existing MidiNode ({ existing: ${existingMidiNode.string}, new: ${midiNodeForNewProps.string} })`
              );
            }
          }
        }

        if (!midiNodeToConnect) {
          // set new midi node for update and add to prepared list (to check if other components conflict in the same batch)
          midiNodeToConnect = midiNodeForNewProps;
          this.activeMidiNodes.add(midiNodeToConnect);
          isMidiNodeNew = true;
        }
      }
    }

    // handle modified value
    const midiOutput = getMidiOutput({
      label: newProps.label,
      midiNode: midiNodeToConnect || this.midiNodeMap.get(instance),
      value:
        isMount && isMidiNodeNew
          ? newProps.value || newProps.defaultValue // send default value if any on initial mount
          : newProps.value,
    });

    // handle modified onInput handler
    let inputHandlerChanged = false;
    if (isMount || newProps.onInput !== oldProps.onInput) {
      inputHandlerChanged = true;
    }

    return midiNodeToConnect === null &&
      midiOutput === null &&
      !inputHandlerChanged
      ? null
      : {
          midiNodeToConnect: midiNodeToConnect,
          midiOutput,
          inputHandlerChanged,
        };
  }

  commitInstanceUpdate(
    instance: MidiInstance,
    updatePayload: MidiInstanceUpdatePayload,
    oldProps: MidiInstance['props'],
    newProps: MidiInstance['props']
  ): void {
    if (updatePayload === null) return;
    const { midiNodeToConnect, midiOutput } = updatePayload;

    // handle modified pattern
    if (midiNodeToConnect !== null) {
      this.connectInstanceToNode(instance, midiNodeToConnect);
    }

    // handle modified value
    if (midiOutput) {
      const midiNode = this.midiNodeMap.get(instance)!;
      if ('data' in midiOutput) {
        this.midiOut.sendSysex(midiOutput);
      } else {
        this.midiOut.sendMidi(midiOutput);
      }
      midiNode.onIO('output', midiOutput);

      // output here means the midi value changed and onChange should be called
      midiNode.instances.forEach((instance) =>
        instance.props.onChange?.(
          'data' in midiOutput ? midiOutput.data : midiOutput
        )
      );
    }

    instance.props = newProps;
  }

  removeInstance(instance: MidiInstance, synchronous?: boolean): void {
    this.disconnectInstanceFromNode(instance, synchronous);
  }

  clearInstances() {
    this.instances.forEach((instance) => this.removeInstance(instance, true));
    host.requestFlush();
  }

  /** The midi in ports available to the session */
  get midiInPorts(): API.MidiIn[] {
    const midiInPorts = [];
    for (let i = 0; true; i += 1) {
      try {
        midiInPorts[i] = host.getMidiInPort(i);
      } catch (error) {
        break;
      }
    }
    return midiInPorts;
  }

  /** Handle midi input, routing it to the correct control object */
  handleMidiInput(message: MidiMessage | SysexMessage) {
    const messageType = message instanceof MidiMessage ? '[MIDI] ' : '[SYSEX]';

    let node: MidiNode | undefined;
    for (const n of this.activeMidiNodes) {
      if (n.test(message)) {
        node = n;
        node.onIO('input', message);
        break;
      }
    }

    // create local copy of instance list in case it changes when running onInput
    const instances = [...(node?.instances || [])];
    const labels: string[] = [];
    instances.forEach((instance) => {
      // check that instance is still in instance list before calling (could be unmounted)
      if (node?.instances.includes(instance)) {
        instance.props.onInput &&
          instance.props.onInput(
            message instanceof SysexMessage ? message.data : message
          );
        instance.props.label && labels.push(instance.props.label);
      }
    });

    if (message instanceof SysexMessage) {
      console.log(
        `${messageType} IN  ${message.port} ==> ${
          labels[0] ? `"${labels.join(',')}" ` : ''
        }${message.data}`
      );
    } else {
      console.log(
        `${messageType} IN  ${message.port} ==> ${message.shortHex}${
          labels[0] ? ` "${labels.join(',')}"` : ''
        }`
      );
    }
  }
}
