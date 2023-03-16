import './env';

import { Session } from './session';
import { reconciler } from './reconciler';
import { Midi } from './components/midi';
import {
  ControllerScript,
  ControllerScriptProps,
} from './components/controller-script';
import {
  createInitState,
  createInitValue,
  createInitObject,
} from './init-helpers';

const session = new Session();

const LEGACY_ROOT = 0; // CONCURRENT_ROOT = 1

const render = (rootNode: JSX.Element) => {
  // If ControllerScript component provided as rootNode, call related controller definition methods
  if (rootNode.type === ControllerScript) {
    const { api, author, name, uuid, vendor, version, midi } =
      rootNode.props as ControllerScriptProps;

    // 1. set bitwig api version

    host.loadAPI(api);

    // 2. define controller script

    host.defineController(
      vendor, // vendor
      name, // name
      version, // version
      uuid, // uuid
      author // author
    );

    // 3. setup and discover midi controllers

    if (midi) {
      if (Array.isArray(midi)) {
        // handle multiple discovery pairs
        host.defineMidiPorts(midi[0].inputs.length, midi[0].outputs.length);
        midi.forEach(({ inputs, outputs }) =>
          host.addDeviceNameBasedDiscoveryPair(inputs, outputs)
        );
      } else if (Array.isArray(midi.inputs) && Array.isArray(midi.outputs)) {
        // handle single discovery pair
        host.defineMidiPorts(midi.inputs.length, midi.outputs.length);
        host.addDeviceNameBasedDiscoveryPair(midi.inputs, midi.outputs);
      } else if (
        typeof midi.inputs === 'number' &&
        typeof midi.outputs === 'number'
      ) {
        // handle simple midi port count
        host.defineMidiPorts(midi.inputs, midi.outputs);
      }
    }
  }

  session.on('init', () => {
    const fiberRoot = reconciler.createContainer(
      session,
      LEGACY_ROOT,
      null,
      false,
      null,
      '',
      () => {},
      null
    );
    reconciler.updateContainer(rootNode, fiberRoot, null, () => null);
  });
};

const ReactBitwig = {
  render,
  session,
  createInitState,
  createInitValue,
  createInitObject,
};

export default ReactBitwig;

export {
  render,
  session,
  Midi,
  ControllerScript,
  createInitState,
  createInitValue,
  createInitObject,
};
export * from './components/midi';
export * from './components/controller-script';
export * from './init-helpers';
