# ![React Bitwig](./docs/assets/react-bitwig-header.png)

⚛️ Build Bitwig Studio controller scripts in React!

ReactBitwig is React based JavaScript framework for building controller scripts in Bitwig Studio. At its core is a custom React renderer for MIDI that enables declarative component based control of your devices via the provided `Midi` component. Built around and on top of this foundation is a suite of smart tools and helpers designed to improve the experience of working in Bitwig's unique JavaScript environment:

- Custom state management solution that takes Bitwig's init phase into consideration.
- Highly detailed TypeScript [type definitions](https://github.com/joslarson/typed-bitwig-api) for Bitwig APIs
- A growing library of useful components, hooks, and other helpers
- Built in debug tooling for Midi I/O logging and log filtering
- [Custom Webpack plugin](https://github.com/joslarson/bitwig-webpack-plugin) enabling use of ES Modules and bundling of NPM packages with project
- Polyfills for relevant missing browser API's (console, setTimeout/setInterval, etc.)

## Quick Start

First make sure you have the following:

- Node.js v16 or newer
- Bitwig Studio v4 or newer

### Project Setup

With that out of the way, let's initialize a new project using ReactBitwig's CLI tool. We'll call our project `getting-started`.

```bash
npx react-bitwig init getting-started
# pass --typescript flag to initialize in TypeScript mode
# run npx react-bitwig --help for detailed usage
```

This command will ask you some questions then generate a working project skeleton based on your responses:

```bash
# answers are optional where a default is provided in parentheses
[react-bitwig] begin project initialization...
Display Name: Getting Started
Vendor/Category: Custom
Author: Joseph Larson
Version (1.0.0):
API Version (17):
[react-bitwig] project initialization complete.
```

If you answered the prompts as shown above your new project will be created within a new `getting-started` directory, relative to your current working directory, and will have the following structure:

```bash
getting-started/
├── dist/ -> ...  # symlinked into default Bitwig control surface scripts directory
├── src/
│   └── getting-started.control.js
├── README.md
├── package.json
├── tsconfig.json
└── webpack.config.js
```

`cd` into your new project directory and install the initial dependencies using npm.

```bash
cd getting-started
npm install
```

Now, we'll run the `build` command, to generate your project's initial build.

```bash
npm run build
```

At this point your newly built project files should have been picked up by Bitwig and your script should be listed under `Custom > Getting Started` in Bitwig's controller selection menu.

Activate your new controller script by selecting it from the script selection menu and assigning your Midi controller's corresponding MIDI I/O.

> **Note**: The default project template is setup assuming a single midi input/output pair, but if you need more than that, more can be defined in the your project's entry file (`src/getting-started.control.js` in this case).

Now, before we start editing files, let's run the build command in dev/watch mode so that our project will rebuild whenever we modify and save a source file.

```bash
npm run dev # run from the project root
# exit the build command with ctrl/cmd+c
```

With that, everything should be in place to start coding your control surface script. Let's get into it :)

### Creating Your First Component

With our bare bones project, our entry file should currently look something like this:

```jsx
// src/getting-started.control.js

import ReactBitwig, { ControllerScript } from 'react-bitwig';

ReactBitwig.render(
  <ControllerScript
    api={17}
    vendor="Custom"
    name="Getting Started"
    version="1.0.0"
    uuid="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
    author="Joseph Larson"
    midi={{ inputs: 1, outputs: 1 }}
  >
    {/* ...add components to render here */}
  </ControllerScript>
);
```

Not very useful yet... Let's jump in and create some init phase values/state and create and wire up our first component, the `PlayToggle`:

```tsx
// src/components/play-toggle.js

import React from 'react';
import ReactBitwig, { Midi } from 'react-bitwig';

// `createInitValue` defines a gettable value that needs to be setup during the init phase
const TransportValue = ReactBitwig.createInitValue(() =>
  host.createTransport()
);

// The createInitState helper assists in wiring up init-time-only
// subscriptions and provides a `.use()` hook for subscribing to
// changes from within React components.
const IsPlayingState = ReactBitwig.createInitState(() => {
  // You can safely access other init states and values inside this initializer
  const transport = TransportValue.get();
  transport
    .isPlaying()
    .addValueObserver((isPlaying) => IsPlayingState.set(isPlaying));
  return false; // return initial state
});

// define our component using TransportValue and IsPlayingState form above
export const PlayToggle = () => {
  // keep track of button pressed state so we can keep the button illuminated
  // while the button is continues to be pressed when the transport is stopped
  const [isPressed, setIsPressed] = React.useState(false);

  // get the transport
  const transport = TransportValue.get();
  // subscribe to isPlaying transport state
  const isPlaying = IsPlayingState.use();

  return (
    <Midi
      // useful for logging/debugging
      label="PLAY"
      // defines the stable parts of MIDI messages associated with the control
      pattern={{ status: 0xb0, data1: 0x18 }}
      // messages matching the above pattern are now bound to this component
      // and can be subscribed to via the onInput prop
      onInput={({ data2 }) => {
        // when pressing the button (data2 > 0), toggle transport.isPlaying
        if (data2 > 0) transport.isPlaying().toggle();
        // update local isPressed state so we can use it in determining the value below
        setIsPressed(data2 > 0);
      }}
      // when setting the value you only have to specify the non-stable parts of
      // the message. We want the button light on if it is pressed or if the
      // transport is playing.
      value={{ data2: isPressed || isPlaying ? 127 : 0 }}
      // caching modes teach ReactBitwig how to keep your hardware state in sync with your
      // script and help optimize to avoid sending redundant MIDI messages
      cacheOnInput // assume MIDI messages sent from the hardware to Bitwig represent a change in hardware state
      cacheOnOutput // assume MIDI messages sent from Bitwig to the hardware represent a change in hardware state
    />
  );
};
```

> **Note:** Generally speaking, when this documentation mentions MIDI input or output, it is speaking from the perspective of the script, not the controller. So "input" is referring to MIDI messages traveling from the controller to the script, and "output" is referencing messages moving from the script to the controller.

Once you've finished building your `PlayToggle` component, import it into `getting-started.control.js` and render it as a child of your ControllerScript component:

```tsx
// src/getting-started.control.js

import ReactBitwig, { ControllerScript } from 'react-bitwig';
import { PlayToggle } from './components/play-toggle';

// render our controller script
ReactBitwig.render(
  <ControllerScript
    api={17}
    vendor="Custom"
    name="Getting Started"
    version="1.0.0"
    uuid="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
    author="Joseph Larson"
    midi={{ inputs: 1, outputs: 1 }}
  >
    <PlayToggle />
  </ControllerScript>
);
```

## The Midi Component

The Midi component allows you to declaratively send and/or receive MIDI messages to synchronize Midi hardware with your controller script state. The Midi component takes the following props:

```ts
type MidiProps = {
  // Name your control (helpful for logging/debugging)
  label?: string;
  // MIDI port messages are sent/received on, defaults to 0
  port?: number;
  // defines initial value to send on mount
  defaultValue?: MidiObjectPattern;
  // defines value to send on render
  value?: MidiObjectPattern;
  // defines value to send on on unmount
  unmountValue?: MidiObjectPattern;
  // defines the stable parts of MIDI messages associated with the control to subscribe to
  pattern?: MidiHexPattern | MidiObjectPattern;
  // called anytime a message is received matching the port and pattern defined above
  onInput?: (message: MidiObjectPattern) => void;
  // similar to onInput, but is only called when input represents a change to hardware state
  onChange?: (message: MidiObjectPattern) => void;
  // assume messages sent from hardware to script represent a change in hardware state
  cacheOnInput?: boolean;
  // assume messages sent from script to hardware represent a change in hardware state
  cacheOnOutput?: boolean;
  // sets the priority of a message, defaulting to false (messages sent during Bitwig's flush phase)
  urgent?: boolean;
};
```

### Sending MIDI Messages

The simplest use case for the Midi component is one where you just want to output a Midi message on mount/render/unmount. This can be accomplished using the `value`, `defaultValue`, and `unmountValue` props.

```tsx
// message sent on mount and render
<Midi value={{ status: 0xb0, data1: 0x18, data2: 0x00 }} />
// message sent on mount and render if value has changed
<Midi value={{ status: 0xb0, data1: 0x18, data2: 0x00 }} cacheOnOutput />
```

```tsx
// message sent on mount only
<Midi defaultValue={{ status: 0xb0, data1: 0x18, data2: 0x00 }} />
```

```tsx
// message sent on unmount only (helpful to zero out a control display when it is no longer rendered)
<Midi unmountValue={{ status: 0xb0, data1: 0x18, data2: 0x00 }} />
```

### Responding to MIDI Input

The `pattern` prop of the Midi component defines which MIDI messages the component instance is subscribed to. The `onInput` props allows you to register a callback to that subscription.

```tsx
// callback passed to onInput will be called for all messages matching the provided pattern
<Midi pattern={{ status: 0xb0, data1: 0x18 }} onInput={(msg) => {...}} />
```

The `onChange` prop can similarly be used to subscribe **only to changes** in the control's hardware state. For example, if the script receives a matching MIDI message that is identical to the current cached state, the onChange handler will not be called. However, this behavior only be leveraged when a component instance has configured its caching mode.

```tsx
<Midi
  pattern={{ status: 0xb0, data1: 0x18 }}
  onChange={(msg) => {...}} // called only when virtual hardware state cache changes
  cacheOnOutput // assume MIDI messages sent from Bitwig to the hardware represent a change in hardware state
/>
```

#### Midi Patterns

Patterns can be defined in string or object literal form.

- **Object literal form** allows you to define MIDI patterns by assuming undefined MIDI byte values to be wild cards (e.g. `{ status: 0xb0, data1: 0x18 }` where any MIDI message matching the provided values will be passed through). Though slightly less powerful and more verbose than string form patterns, you may find object literal form to be more readable while still covering the vast majority of use cases.

- **String form** patterns are the most expressive and concise, representing the MIDI port and each MIDI byte as consecutive two character hexadecimal values, with question marks used for wildcard matching (e.g. `'B018??'` where `B0`, `18`, and `??` represent the status, data1, and data2 values).

> **Note**: The values for the status and data1 arguments above (e.g. `0xb0`) are just plain numbers written in JavaScript's hexadecimal (base 16) form. This makes it easier to to see the type of message and which channel the control maps to, but you can use regular base 10 integers 0-127 here if you want to.

### Caching Modes

The `pattern`, `cacheOnInput`, and `cacheOnOutput` props work together to help ReactBitwig understand how to cache MIDI input/output messages such that redundant messages—those that would not change your MIDI controller's state—are not sent.

The caching mode configuration you choose will depending on your MIDI hardware (or virtual device). Passing the `cacheOnInput` prop tells ReactBitwig to assume that messages sent from hardware to script represent a change in hardware state. Similarly, the `cacheOnOutput` prop hints that messages sent from script to hardware represent a change in hardware state.

As an example, pretend you have a hardware button with and integrated light. It's a gate style button, which sends a `data2` of 127 when pressed and 0 when released. Now consider when you press this button (and a the 127 value input is received by your script), does the button light up while it is pressed? And what about when the script outputs a `data2` of 127 back to the hardware, does the button light up then?

Different hardware implementations answer these questions in different ways. Some hardware will update the hardware state both when sending and receiving data, while others will only do so when receiving data, and still others allow you configure such behavior.

By default, the Midi component assumes no caching behavior at all, so it's important to understand how your hardware answers these questions and to configure Midi component instances accordingly.

### Logging/Debugging Midi I/O & the `label` Prop

Bitwig provides a "Controller Script Console" for logging messages to debug your controller scripts. Leveraging this, ReactBitwig provides some extra built-in tooling to make debugging easier. In your controller script settings (for controller scripts built using ReactBitwig), you can turn on automatic logging of MIDI input, output, or both. MIDI I/O is logged in hexadecimal format and is tagged with the label provided to a matching Midi component instance if any. Sample log output:

```
// Format: [MIDI] IN/OUT PORT ==>/<== XXXXXX "Control Label"
[MIDI]  IN  0 ==> 91087F "PLAY"
[MIDI]  OUT 0 <== 91087F "PLAY"
[MIDI]  IN  0 ==> 910800 "PLAY"
```

## State Management

Bitwig has a unique runtime environment, and as part of that, you can only access some features during the "init" phase (which runs only once when your script first boots up). Basically any Bitwig data/event you would like to subscribe to (channel count, selected track, transport state, etc) has to be wired up during this phase, making things a bit awkward for a paradigm like React where it is common to initialize such subscriptions on mount and tear them down on unmount.

To improve the developer experience in relation to the restrictions placed on us by this "init" phase, ReactBitwig provides some "init" helpers to assist in defining init phase data and subscriptions/state.

### `createInitValue`

Define a getter for an unchanging value, that is run only once during the init phase, but whose value can be requested any time thereafter (in our React components or elsewhere).

```ts
// `createInitValue` defines a gettable value that needs to be setup during the init phase
const TransportValue = ReactBitwig.createInitValue(() =>
  host.createTransport()
);

// Access value (after init)
const SomeComponent = () => {
  const transport = TransportValue.get();
  ...
}
```

### `createInitObject`

Similar to `createInitValue`, but returns an object where key access is defined as getters underneath, so that it can be used like a regular object literal, without throwing errors before the init phase begins.

```ts
const bitwig = ReactBitwig.createInitObject(() => {
  const arrangerCursorClip = host.createArrangerCursorClip(4, 128);
  const launcherCursorClip = host.createLauncherCursorClip(4, 128);

  // transport
  const transport = host.createTransport();
  transport.subscribe();
  transport.tempo().markInterested();
  transport.getPosition().markInterested();
  transport.isPlaying().markInterested();
  transport.timeSignature().markInterested();

  // application
  const application = host.createApplication();
  application.panelLayout().markInterested();

  // cursorTrack
  const cursorTrack = host.createCursorTrack(0, 16);
  cursorTrack.isGroup().markInterested();
  cursorTrack.color().markInterested();
  cursorTrack.position().markInterested();

  // trackBank
  const trackBank = host.createMainTrackBank(8, 0, 0);
  trackBank.cursorIndex().markInterested();
  trackBank.channelCount().markInterested();
  trackBank.setChannelScrollStepSize(8);


  return {
    arrangerCursorClip,
    launcherCursorClip,
    transport,
    application,
    cursorTrack,
    trackBank,
  };
});


// use it in a component as if it's a regular object literal
const SomeComponent = () => {
  // note: destructuring must happen in the component
  // (it will error if you destructure at the module level)
  const { application,  transport } = bitwig;
  ...
}
```

### `createInitState`

Creates an atomic piece of global state with an initializing function that is called during Bitwig's init phase. The resulting `InitState` instance provides a `.set(...)` method for updating the state, a `.use()` hook method for subscribing React components to the state, and `get/subscribe/unsubscribe` methods for accessing and subscribing to state outside of React components.

```ts
// The createInitState helper assists in wiring up init-time-only
// subscriptions and provides a `.use()` hook for subscribing to
// changes from within React components.
const IsPlayingState = ReactBitwig.createInitState(() => {
  // You can safely access other init states and values inside this initializer
  const transport = TransportValue.get();
  transport
    .isPlaying()
    .addValueObserver((isPlaying) => IsPlayingState.set(isPlaying));

  return false; // return initial state
});
```
