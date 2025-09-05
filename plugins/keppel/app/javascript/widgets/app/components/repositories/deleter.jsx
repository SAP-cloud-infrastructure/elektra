import React from "react"
import { addSuccess } from "lib/flashes"
import { makeGCNotice } from "../utils"

const display = (msg) => (
  <>
    <span className="spinner" /> {msg}...
  </>
)

export default class RepositoryDeleter extends React.Component {
  componentDidMount() {
    this.handleDelete()
  }

  async handleDelete() {
    try {
      await this.props.deleteRepository()
      addSuccess(makeGCNotice("Repository"))
    } finally {
      this.props.handleDoneDeleting()
    }
  }

  render() {
    return display(`Deleting repository`)
  }
}
