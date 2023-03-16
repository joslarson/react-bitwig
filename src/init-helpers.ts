import React from 'react';
import { session } from './index';

export type InitValue<V> = { get: () => V };

export function createInitValue<V>(initializer: () => V): InitValue<V> {
  let value: V;

  let initialized = false;
  let initializing = false;
  const initialize = () => {
    if (initializing) {
      throw new Error('Circular initialization dependency detected.');
    } else if (!session.isInitPhase) {
      throw new Error(
        'Access to init value not allowed until during or after the init phase.'
      );
    }

    initializing = true;
    value = initializer();
    initialized = true;
    initializing = false;
  };

  session.on('init', () => {
    if (!initialized) initialize();
  });

  return {
    get: () => {
      if (!initialized) initialize();
      return value;
    },
  };
}

export function createInitObject<O extends { [key: string]: any }>(
  initializer: () => O
): O {
  let object: O = {} as O;

  let initialized = false;
  let initializing = false;
  const initialize = () => {
    if (initializing) {
      throw new Error('Circular initialization dependency detected.');
    } else if (!session.isInitPhase) {
      throw new Error(
        'Access to init value not allowed until during or after the init phase.'
      );
    }

    initializing = true;
    object = initializer();
    initialized = true;
    initializing = false;
  };

  const gettersObject = {} as O;

  session.on('init', () => {
    if (!initialized) initialize();
    Object.keys(object).forEach((k) => {
      Object.defineProperty(gettersObject, k, {
        get: () => object[k],
      });
    });
  });

  return gettersObject;
}

export type InitState<S> = {
  get: () => S;
  set: (state: Partial<S> | ((state: S) => Partial<S>)) => void;
  subscribe: (listener: (value: S) => void) => void;
  unsubscribe: (listener: (value: S) => void) => void;
  use: {
    (): S;
    <T>(selector: (state: S) => T): T;
  };
};

export function createInitState<S>(initializer: () => S): InitState<S> {
  let currentState: S;

  const listeners: ((state: S) => void)[] = [];

  const setState = (state: Partial<S> | ((state: S) => Partial<S>)) => {
    state = typeof state === 'function' ? state(currentState) : state;
    const newState = (
      currentState === undefined
        ? state
        : typeof state === 'object' && !Array.isArray(state)
        ? { ...currentState, ...state }
        : state
    ) as S;
    if (currentState !== newState) {
      currentState = newState;
      listeners.forEach((listener) => {
        listener(newState);
      });
    }
  };

  let initialized = false;
  let initializing = false;
  const initialize = () => {
    if (initializing) {
      throw new Error('Circular initialization dependency detected.');
    }
    if (!session.isInitPhase) {
      throw new Error(
        'Access to init state not allowed until during or after the init phase.'
      );
    }

    initializing = true;
    const initialState = initializer();
    if (initialState !== undefined) {
      setState(initialState);
    }
    initialized = true;
    initializing = false;
  };

  session.on('init', () => {
    if (!initialized) initialize();
  });

  const get = (): S => {
    // 1. make sure its initialized
    if (!initialized) initialize();
    // 2. return initialized state as readonly state
    return currentState;
  };
  const set = (state: Partial<S> | ((state: S) => Partial<S>)) => {
    setState(state);
  };
  const subscribe = (listener: (state: S) => void) => {
    listeners.push(listener);
  };
  const unsubscribe = (listener: (state: S) => void) => {
    listeners.splice(listeners.indexOf(listener), 1);
  };
  const use = <T extends ((state: S) => any) | undefined = undefined>(
    selector?: T
  ): T extends (state: S) => any ? ReturnType<T> : S => {
    const [hookState, setHookState] = React.useState(
      selector ? selector(currentState) : currentState
    );

    // layout effect to make sure the hook state is updated when the state changes on init
    React.useLayoutEffect(() => {
      const listener = (state: S) => {
        setHookState(selector ? selector(state) : state);
      };
      subscribe(listener);
      return () => unsubscribe(listener);
    }, []);

    return hookState;
  };
  return { get, set, subscribe, unsubscribe, use };
}
