import React from "react"

const display = (msg) => (
  <>
    <span className="spinner" /> {msg}...
  </>
)

export default class RepositoryDeleter extends React.Component {
  state = {
    manifestCount: null,
    currentDeleteTarget: null,
  }

  componentDidMount() {
    this.deleteNext()
  }
  componentDidUpdate() {
    this.deleteNext()
  }

  deleteNext() {
    //phase 1: wait for manifests to be fetched, then initialize this.state.manifestCount
    const {
      data: manifests,
      isFetching,
      requestedAt,
      receivedAt,
    } = this.props.manifests
    if (isFetching || !requestedAt) {
      return
    }
    if (receivedAt === null) {
      //when isFetching becomes false, but receivedAt stays null, there was an error
      this.props.handleDoneDeleting()
      return
    }
    if (this.state.manifestCount === null) {
      this.setState({ ...this.state, manifestCount: manifests.length })
    }

    //phase 2: delete manifests until there are none left (we delete one
    //manifest in each step, then the change in the Redux store will trigger
    //componentDidUpdate() which calls this function again)
    if (manifests.length > 0) {
      const digest = manifests[0].digest
      if (this.state.currentDeleteTarget === digest) {
        //do not call deleteManifest() twice for same manifest
        return
      }
      this.setState({ ...this.state, currentDeleteTarget: digest })

      this.props.deleteManifest(digest).catch(() => {
        this.props.handleDoneDeleting(true)
      })
      return
    }

    //phase 3: delete repository once empty
    if (this.state.currentDeleteTarget === "repo") {
      //do not call deleteRepository() twice
      return
    }
    this.setState({ ...this.state, currentDeleteTarget: "repo" })
    this.props.deleteRepository().finally(this.props.handleDoneDeleting())
  }

  render() {
    //display for phase 1 (see above)
    const { data: manifests, receivedAt } = this.props.manifests
    if (receivedAt == null) {
      return display("Calculating")
    }

    //display for phase 2 (see above)
    if (manifests.length > 0) {
      const { manifestCount } = this.state
      return display(
        `Deleting manifests (${
          manifestCount - manifests.length + 1
        }/${manifestCount})`
      )
    }

    //display for phase 3 (see above)
    return display(`Deleting repository`)
  }
}
