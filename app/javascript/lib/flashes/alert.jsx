import PropTypes from "prop-types"
import React from "react"
export class Alert extends React.Component {
  componentDidMount() {
    this.timer = setTimeout(this.props.onClose, this.props.timeout)
  }

  componentWillUnmount() {
    clearTimeout(this.timer)
  }

  alertClass(type) {
    let classes = {
      error: "alert-danger",
      alert: "alert-warning",
      notice: "alert-info",
      success: "alert-success",
    }
    return classes[type] || classes.success
  }

  renderMessageBody(message) {
    if (message.text instanceof Array) {
      return React.Children.map(message.text, (child) => {
        if (!child) return null
        return React.cloneElement(child)
      })
    } else if (typeof message.text == "object") {
      return React.cloneElement(message.text)
    } else {
      return <div>{message.text}</div>
    }
  }

  render() {
    const message = this.props.message
    const alertClassName = `alert ${this.alertClass(message.type)}`

    return (
      <div className={alertClassName}>
        <button className="btn-close" aria-label="Close" onClick={this.props.onClose} />
        {this.renderMessageBody(message)}
      </div>
    )
  }
}

Alert.propTypes = {
  onClose: PropTypes.func,
  timeout: PropTypes.number,
  message: PropTypes.object.isRequired,
}

Alert.defaultProps = {
  timeout: 15000,
}
