// The widget comes from the limes-ui package, which is a separate package from the elektra package.
// https://github.com/sapcc/LimesUI
// limes-ui implements the juno app interface which has the mount method.
// The mount method is used to render the widget in the DOM.
import { mount } from "@sapcc/maillog-ui"

const currentScript = document.currentScript
const wrapper = document.createElement("div")
const dataset = currentScript.dataset
wrapper.id = "maillog-ui"
currentScript.replaceWith(wrapper)

let props
try {
  props = JSON.parse(dataset?.props)
} catch (e) {
  props = {}
}

mount(wrapper, { props })
