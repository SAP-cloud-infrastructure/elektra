import essentialStyles from "./tailwind.scss?inline"

import "./core/jquery"
import "jquery-ujs"
import "bootstrap"
import "./core/dialogs"

const styles = document.createElement("style")
styles.setAttribute("type", "text/css")
styles.setAttribute("data-name", "essentials")
styles.textContent = essentialStyles
document.head.appendChild(styles)
