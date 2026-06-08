// ArcherUI widget - Endpoint as a Service
// https://github.com/sapcc/archer
import { mount } from "@sapcc/archer-ui"

const currentScript = document.currentScript
const wrapper = document.createElement("div")
const dataset = currentScript.dataset
wrapper.id = "archer-ui"
currentScript.replaceWith(wrapper)

let props
try {
  props = JSON.parse(dataset?.props)
} catch (e) {
  props = {}
}

mount(wrapper, { props })