//
// Add to your .env following variable LBAAS2_LOGGER and restart yarn build

console.log("==========================================", process.env.NODE_ENV)
import env from "env"
const LBAAS2_LOGGER = process.env.LBAAS2_LOGGER || "LBAAS2_LOGGER"

const BASE = "lbaas2"
const COLOURS = {
  debug: "pink",
  trace: "lightblue",
  info: "cyan",
  warn: "yellow",
  error: "red",
}

class Log {
  generateMessage(level, message) {
    const namespace = `${BASE}:${level}= `
    if (LBAAS2_LOGGER) {
      console.log(
        "%c" + namespace + "%c" + message,
        "color:" + COLOURS[level] + ";font-weight:bold;",
        "color:reset" + ";font-weight:reset;"
      )
    }
  }

  debug(message) {
    return this.generateMessage("debug", message)
  }

  trace(message) {
    return this.generateMessage("trace", message)
  }

  info(message) {
    return this.generateMessage("info", message)
  }

  warn(message) {
    return this.generateMessage("warn", message)
  }

  error(message) {
    return this.generateMessage("error", message)
  }
}

export default new Log()
