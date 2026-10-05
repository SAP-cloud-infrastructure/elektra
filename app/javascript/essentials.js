import essentialStyles from "./tailwind.scss?inline"

import "./core/jquery"
import "jquery-ujs"
import "bootstrap"
import "./core/bs3_jquery_bridge" // SPIKE: re-expose $.fn.modal/.tooltip/.popover/.collapse on BS5
import "./core/dialogs"
import "./core/global_notifications"
import "./core/christmas"

const styles = document.createElement("style")
styles.setAttribute("type", "text/css")
styles.setAttribute("data-name", "essentials")
styles.textContent = essentialStyles
document.head.appendChild(styles)
