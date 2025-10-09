# URL State Provider: Streamlining State Management in the URL

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

URL State Provider is your solution for simplifying the intricate task of managing multiple application states within the URL. Originally conceived for Micro Frontends (MFEs), this module empowers you to effortlessly navigate between diverse views while preserving the art of deep linking.

## Key Features

- **Global State Synchronization:** Seamlessly synchronize your application's global state with the URL. URL State Provider offers a centralized state management mechanism, ensuring your data stays in perfect harmony with your application's navigation.

- **Push Function:** Empower your applications with the 'push' function, complete with a unique key. This allows each application to autonomously store and manage its own state within the global state, ensuring data integrity.

- **Immediate URL Updates:** Watch in amazement as every tweak in your global state triggers an instant update to a specific search parameter in the URL. Conversely, any alteration in the URL promptly influences the global state. It's bidirectional synchronization at its best.

By integrating URL State Provider, you unlock the ability to manage complex application states with ease, right from the heart of the URL. This not only enhances navigation but also makes deep linking a breeze within your Micro Frontends.

## Automatic Encoding Detection

URL State Provider goes the extra mile with its intelligent encoding detection mechanism, simplifying the choice between two encoding methods: human-readable encoding via the Json-URL library and efficient LZString encoding. The selection is made dynamically based on the length of the data being encoded.

- **Human-Readable Encoding:** When your data falls within a reasonable range for human readability, URL State Provider elegantly utilizes the Json-URL library for encoding. The result? URL parameters that are not only efficient but also user-friendly, making your URLs a joy to read.

- **LZString Encoding:** However, should your data transcend the bounds of human readability, fear not. URL State Provider is quick to adapt, seamlessly switching to LZString encoding. This method efficiently compresses your data, ensuring your URLs remain lean and optimized.

By automatically determining the most suitable encoding method, URL State Provider transforms URL management into a graceful dance, effortlessly balancing readability and efficiency.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Installation

You can install the URL State Provider library via npm, pnpm or yarn:

```bash
npm install @cloudoperators/url-state-provider
# or
yarn add @cloudoperators/url-state-provider
# or
pnpm add @cloudoperators/url-state-provider
```

## Usage

Here's a basic example of how to use URL State Provider in your JavaScript application:

```javascript
import urlStateProvider from "@cloudoperators/url-state-provider"

// get initial state for app1 from URL (initial page URL)
urlStateProvider.currentState("app1")

// add a new URL to the history object
urlStatusProvider.push("app1", { p: "/items" })
// replace last URL with a new one
urlStatusProvider.replace("app1", { p: "/items/new" })
```

## API Reference

The URL State Router library provides a set of methods and functions to help you manage and manipulate your application's state in the URL. Below is a reference guide to these methods:

### `URLStateRouter.registerConsumer(stateID)`

- **Description:** Registers a consumer for a specific state identified by `stateID`.
- **Parameters:**
  - `stateID` (string): The key to identify the specific state in the search parameters.
- **Returns:** An object with the following methods:
  - `currentState()`: Get the current state for the registered `stateID`.
  - `onChange(callback)`: Add a listener to be notified when the state changes.
  - `onGlobalChange(callback)`: Add a listener to be notified when any state changes.
  - `push(state, historyOptions)`: Push a new state to the URL, optionally providing history options.
  - `replace(state, historyOptions)`: Replace the current state in the URL, optionally providing history options.

### `URLStateRouter.currentState(stateID)`

- **Description:** Get the current state for a specific `stateID`.
- **Parameters:**
  - `stateID` (string): The key to identify the specific state in the search parameters.
- **Returns:** The current state for the specified `stateID`.

### `URLStateRouter.onChange(stateID, callback)`

- **Description:** Add a listener to be notified when a specific state identified by `stateID` changes.
- **Parameters:**
  - `stateID` (string): The key to identify the specific state in the search parameters.
  - `callback` (function): The function to be executed when the state changes.

### `URLStateRouter.onGlobalChange(callback)`

- **Description:** Add a listener to be notified when any state changes.
- **Parameters:**
  - `callback` (function): The function to be executed when any state changes.

### `URLStateRouter.push(stateID, state, historyOptions)`

- **Description:** Push a new state to the URL for a specific `stateID`. The old and new states are merged.
- **Parameters:**
  - `stateID` (string): The key to identify the specific state in the search parameters.
  - `state` (object): The new state to be pushed.
  - `historyOptions` (object, optional): Options for the window.history, such as `state`, `title`, and `replace`.

### `URLStateRouter.replace(stateID, state, historyOptions)`

- **Description:** Replace the current state in the URL for a specific `stateID`. The old state is overwritten.
- **Parameters:**
  - `stateID` (string): The key to identify the specific state in the search parameters.
  - `state` (object): The new state to be replaced.
  - `historyOptions` (object, optional): Options for the window.history, such as `state`, `title`, and `replace`.

### `URLStateRouter.addOnChangeListener(stateID, listener)`

- **Description:** Add a listener for history changes for a specific `stateID`.
- **Parameters:**
  - `stateID` (string): The key to identify the specific state in the search parameters.
  - `listener` (function): The function to be executed when the history changes.

### `URLStateRouter.removeOnChangeListener(stateID)`

- **Description:** Remove a listener for a specific `stateID`.
- **Parameters:**
  - `stateID` (string): The key to identify the specific state in the search parameters.

---

Please make sure to adjust and expand this reference based on the specific details and usage of your library. Include descriptions, parameter explanations, and any additional context that helps users understand how to use each function effectively.

## Examples

### Low level

```js
import urlStateProvider from "@cloudoperators/url-state-provider"

// Add a listener for changes on URL for the state of app1
// The callback function is always executed when the state for app1 changes.
// The status changes if, for example, a new status is pushed from the
// app or if the user clicks the back and forward buttons in browser.
urlStateProvider.addOnChangeListener("app1", (newState) => {
  console.log(newState)
})

// get initial state for app1 from URL (initial page URL)
urlStateProvider.currentState("app1")

// add a new URL to the history object
urlStatusProvider.push("app1", { p: "/items" })
// replace last URL with a new one
urlStatusProvider.replace("app1", { p: "/items/new" })

// unregister listener
urlStateProvider.removeOnChangeListener("app1")
```

### High level

```js
import urlStateProvider from "@cloudoperators/url-state-provider"

const consumer1 = urlStateProvider.registerConsumer("app1")
const consumer2 = urlStateProvider.registerConsumer("app2")

// Listen for changes in state resulting from navigation button clicks
const unregisterConsumer2 = consumer2.onChange((newState) => console.log("State changed due to navigation:", newState))

consumer2.currentState()
consumer2.push({ p: "/items" })
consumer2.replace({ p: "/items/new" })

unregisterConsumer2()
```

## Contributing

We welcome contributions from the community. Please follow our [contribution guidelines](https://github.com/cloudoperators/juno/blob/main/CONTRIBUTING.md) to contribute to this project.

## License

Licensed under the [Apache License](LICENSE).
