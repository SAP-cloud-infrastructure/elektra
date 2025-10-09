# Messages Provider

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

Manage and display messages in your application easily and with the [Juno message component](https://github.com/cloudoperators/juno/blob/main/libs/juno-ui-components/README.md).

A message holds generally important information to help understand the contents, purpose, or state of a whole page or view.

This lib uses a **context** store based on Zustand to manage the messages. That means that you can add as many contexts as you need. This is the case when you want to manage and display the messages in different locations in your main application as for example in a panel or modal.

## Requirements

In order to run this library in your application you need to install also following libraries which are not included in the bundle:

- @cloudoperators/juno-ui-components, recommended version ^2.14.1
- react, recommended version 18.2.0
- zustand, recommended version ^4.5.2

```bash
yarn add zustand@4.5.2, react@18.2.0 @cloudoperators/juno-ui-components
```

## Usage

1. Import this lib

   ```bash
   yarn add @cloudoperators//messages-provider
   ```

2. Add the message **MessagesProvider**. Normally it is set on the top of your application so you can use it from everywhere underneath.

   ```javascript
   import React from "react"
   import { MessagesProvider } from "@cloudoperators/messages-provider"
   import AppContent from "./AppContent"

   const App = (props) => {
     return (
       <MessagesProvider>
         <AppContent />
       </MessagesProvider>
     )
   }

   export default App
   ```

3. Add the **Messages** container. This component hold the Juno messages to display. The messages container should be placed as a `descendant component` of the MessagesProvider. See that the App component holds the messages-provider and the `descendant component` AppContent holds the messages container. See the official [react context documentation](descendants) for more information.

   ```javascript
   import React from "react"
   import { Messages } from "@cloudoperators/messages-provider"
   import AppContent from "./AppContent"

   const AppContent = (props) => {
     return (
       <>
         <Messages />
         <h1>Hello world!</h1>
       <>
     )
   }
   ```

4. Use the following hook **useActions** to manage the messages from any descendant component in your application.

   ```javascript
   import React from "react"
   import { useActions, Messages } from "@cloudoperators/messages-provider"

   const AppContent = (props) => {
     const { addMessage } = useActions()

     const onButtonClick = () => {
       addMessage({
         variant: "info",
         text: "Hello world!",
       })
     }

     return (
       <>
         <Messages />
         <h1>Hello world!</h1>
         <button onclick={onButtonClick()}>Send message</button>
       </>
     )
   }

   export default AppContent
   ```

## Multiple contexts

This is the case when you want to manage and display the messages in different locations, for example in your main application as in a panel or modal. Following is an example of a component, NewItem, displaying a Panel and holding an new MessagesProvider.

```javascript
import React from "react"
import { MessagesProvider } from "@cloudoperators/messages-provider"
import NewItemForm from "./NewItemForm"
import { Panel } from "@cloudoperators/juno-ui-components"

const NewItem = (props) => {
  return (
    <Panel opened={true} heading="New Item">
      <MessagesProvider>
        <NewItemForm />
      </MessagesProvider>
    </Panel>
  )
}

export default NewItem
```

Within the NewItemForm component all actions will be handled bei the first `parent messages-provider`, the one in `NewItem`, and the results displayed in the `Messages` container descendant of NewItem, the one in NewItemForm. So now you have two contexts, the main in your `App` component and one extra in the `NewItem` component.

```javascript
import React from "react"
import { useActions, Messages } from "@cloudoperators/messages-provider"
import { PanelBody } from "@cloudoperators/juno-ui-components"

const NewItemForm = (props) => {
  const { addMessage } = useActions()

  const onButtonClick = () => {
    addMessage({
      variant: "info",
      text: "Hello Panel!",
    })
  }

  return (
    <PanelBody>
      <Messages />
      <h1>Hello From Panel!</h1>
      <button onclick={onButtonClick()}>Send message</button>
    </PanelBody>
  )
}

export default NewItemForm
```

## Availabe attributes

- **messages**: return all messages int the store

  ```javascript
  import { useMessages } from "@cloudoperators/messages-provider"
  ...
  const messages = useMessages()
  ...
  ```

## Availabe actions

- **messages**: return all messages int the store

  ```javascript
  import { useMessageStore } from "@cloudoperators/messages-provider"
  ...
  const messages = useMessageStore((state) => state.messages)
  ...
  ```

- **addMessage**: adds a message to the store
  Accepts an object containing:

  - variant (string). Variants are defined below.
  - text (string or object)

  Returns the message id if succeed otherwise null.

  ```javascript
  import { useActions } from "@cloudoperators/messages-provider"
  ...
  const { addMessage } = useActions()
  ...
  addMessage({
    variant: "info",
    text: "Hello world!",
  })
  ...
  ```

- **removeMessage**: removes the message with the given id from the store
  Accepts a paremeter containing the id as string from the message to remove.

  ```javascript
  import { useActions } from "@cloudoperators/messages-provider"
  ...
  const { removeMessage } = useActions()
  ...
  removeMessage("message_ID")
  ...
  ```

- **resetMessages**: removes all messages in the store

  ```javascript
  import { useActions } from "@cloudoperators/messages-provider"
  ...
  const { resetMessages } = useActions()
  ...
  resetMessages()
  ...
  ```

## Variants

Following variants are available:

- info
- warning
- danger
- error
- success

Variant **info** and **success** will be automatically dismissed after 10 seconds by default.
