import essentialStyles from "./tailwind.scss?inline"

import "./core/jquery"
import "jquery-ujs"
// Load the ONE real Bootstrap copy and publish it globally. Every other bundle
// receives a shim (see config/esbuild/bootstrap_singleton_plugin.js) that
// re-exports this single instance, so there is exactly one Bootstrap on the
// page — one data-api listener, one modal backdrop. `essentials` is the first
// script tag in the layout, so the global is set before any other bundle runs.
import * as bootstrap from "bootstrap/real"
window.bootstrap = bootstrap
import "./core/bootstrap_engine"
import "./core/dialogs"
import "./core/global_notifications"
import "./core/christmas"

const styles = document.createElement("style")
styles.setAttribute("type", "text/css")
styles.setAttribute("data-name", "essentials")
styles.textContent = essentialStyles
document.head.appendChild(styles)
