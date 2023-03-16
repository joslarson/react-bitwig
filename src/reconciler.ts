import ReactReconciler from 'react-reconciler';
import { DefaultEventPriority } from 'react-reconciler/constants';

import { MidiInstanceUpdatePayload } from './controls/midi/midi-connector';
import { MidiInstance, MidiInstanceProps } from './controls/midi/midi-instance';
import { Session } from './session';

export const reconciler = ReactReconciler<
  'midi', // Type
  MidiInstanceProps, // Props
  Session, // Container
  MidiInstance, // Instance
  never, // TextInstance
  MidiInstance, // SuspenseInstance
  MidiInstance, // HydratableInstance
  MidiInstance, // PublicInstance
  null, // HostContext
  MidiInstanceUpdatePayload, // UpdatePayload
  unknown, // _ChildSet (Placeholder for undocumented API)
  number, // TimeoutHandle
  -1 // NoTimeout
>({
  supportsMutation: true, // we're choosing to build this in mutation mode
  supportsPersistence: false, // (not persistence mode)
  supportsHydration: false, // hydration does not apply in this env
  scheduleTimeout: setTimeout, // timeout scheduler for env
  cancelTimeout: clearTimeout, // timeout clear function for env
  noTimeout: -1, // value that can never be a timeout id
  isPrimaryRenderer: true, // this will be the only renderer

  createInstance(type, props) {
    if (type !== 'midi') {
      throw new Error(`Unsupported intrinsic element type "${type}"`);
    }
    return new MidiInstance(props);
  },

  appendChildToContainer(container, child) {
    // add pattern to container if it hasn't already been registered with matching pattern and return it
    // if it has, increase count of components depending on it
    // or throw error because pattern doesn't fully match but conflicts with existing pattern
    // connect event listeners for new ones
    container.midi.addInstance(child);
  },

  insertInContainerBefore(container, child, _beforeChild) {
    container.midi.addInstance(child);
  },

  removeChildFromContainer(container, child) {
    // find child in container and decrement pointer count.
    // If decrementing results in count of 0, remove from container, cleanup
    container.midi.removeInstance(child);
  },

  prepareUpdate(instance, type, oldProps, newProps, container) {
    // check if update is needed, if not return null, otherwise optionally return data for use in commit
    return container.midi.prepareInstanceUpdate(instance, oldProps, newProps);
  },

  commitUpdate(instance, updatePayload, type, oldProps, newProps) {
    // commit changes to instance (instance should have access to container and node)
    instance.commitUpdate(updatePayload, oldProps, newProps);
  },

  getPublicInstance(instance) {
    return instance;
  },

  clearContainer(container) {
    // remove all instances from container
    container.midi.clearInstances();
  },

  // Required methods that are not needed in this env

  preparePortalMount() {
    throw new Error('ReactBitwig does not support portals.');
  },

  createTextInstance() {
    throw new Error('ReactBitwig does not support text instances.');
  },

  appendChild() {
    // should never reach this this
    throw new Error(
      'ReactBitwig does not support nesting of intrinsic elements'
    );
  },

  appendInitialChild() {
    // should never reach this this
    throw new Error(
      'ReactBitwig does not support nesting of intrinsic elements'
    );
  },

  removeChild() {
    // should never reach this this
    throw new Error(
      'ReactBitwig does not support nesting of intrinsic elements'
    );
  },

  insertBefore() {
    // should never reach this this
    throw new Error(
      'ReactBitwig does not support nesting of intrinsic elements'
    );
  },

  finalizeInitialChildren() {
    return false; // return false to skip this functionality
  },

  getRootHostContext() {
    return null;
  },

  getChildHostContext(parentHostContext) {
    return parentHostContext;
  },

  prepareForCommit() {
    return null;
  },

  resetAfterCommit() {},

  shouldSetTextContent() {
    return false;
  },

  getCurrentEventPriority() {
    return DefaultEventPriority;
  },

  getInstanceFromNode() {
    throw new Error('Not implemented.');
  },

  prepareScopeUpdate() {
    throw new Error('Not implemented.');
  },

  getInstanceFromScope() {
    throw new Error('Not implemented.');
  },

  beforeActiveInstanceBlur() {},

  afterActiveInstanceBlur() {},

  detachDeletedInstance(node) {},
});
