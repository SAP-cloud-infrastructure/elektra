import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Link } from "react-router-dom"
import { SearchField } from "lib/components/search_field"
import React from "react"

export default class LiveSearchModal extends React.Component {
  state = {
    show: true,
    isFetching: false,
    errors: null,
    objectType: "",
    term: "",
    responseData: null,
  }

  componentDidMount = () => {
    this.setState({
      term: this.props.term || "",
      objectType: this.props.objectType || "",
    })
  }

  restoreUrl = (e) => {
    if (this.state.show) return

    // go to previous url
    // this is the path before /live
    // for example /universal-search/live -> /universal-search
    if (this.props.match && this.props.match.path) {
      const found = this.props.match.path.match(/(\/[^/]+)\/live/)
      if (found) {
        this.props.history.replace(found[1])
        return
      }
    }
    // else go back
    this.props.history.goBack()
  }

  hide = (e) => {
    if (e) e.stopPropagation()
    this.setState({ show: false })
  }

  liveSearch = () => {
    this.setState({ isFetching: true })
    // this.props.liveSearch is a Promise
    // so we call then and catch
    this.props
      .liveSearch(this.state.objectType, this.state.term)
      .then((responseData) =>
        this.setState({
          responseData: { ...responseData, items: responseData.items.length },
          isFetching: false,
          errors: null,
        })
      )
      .catch((errors) => this.setState({ isFetching: false, errors: errors }))
  }

  search = () => {
    // refresh search results and close
    this.props.search(this.state.objectType, this.state.term)
    this.hide()
  }

  isValid = () =>
    this.state.objectType.trim().length > 0 && this.state.term.trim().length > 0

  render() {
    const availableTypes = this.props.types.items.sort()
    const responseData = this.state.responseData

    return (
      <Modal
        show={this.state.show}
        onExited={this.restoreUrl}
        onHide={this.hide}
        bsSize="large"
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">Live Search</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-info">
            It is possible that an object exists in OpenStack but not in our
            object cache. If you know the OpenStack object type we can try a
            live search against the OpenStack backend. Please choose the type
            from the dropdown.
          </div>

          <form
            className="form-inline"
            onSubmit={(e) => {
              e.preventDefault()
              this.search()
            }}
          >
            <div className="form-group">
              <select
                onChange={(e) => this.setState({ objectType: e.target.value })}
                value={this.state.objectType}
                className="form-control"
                disabled={this.state.isFetching}
              >
                {this.props.types.isFetching ? (
                  <option>Loading Types...</option>
                ) : (
                  <>
                    <option value="">All</option>
                    {availableTypes.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <div className="form-group">
              <SearchField
                isFetching={this.state.isFetching}
                onChange={(term) => this.setState({ term })}
                value={this.state.term}
                disabled={this.state.isFetching}
                placeholder="Object ID, name or description"
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={(e) => {
                e.preventDefault()
                this.liveSearch()
              }}
              disabled={this.state.isFetching || !this.isValid()}
              type="button"
            >
              {this.state.isFetching ? "Please wait ..." : "Go!"}
            </button>
          </form>

          {responseData && (
            <p>
              <br />
              Found <b>{responseData.items}</b> item
              {responseData.items != 1 ? "s" : ""}
              {responseData.service_call && (
                <>
                  {" "}
                  by calling <b>{responseData.service_call}</b>
                </>
              )}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          {responseData && responseData.items > 0 ? (
            <Button bsStyle="primary" onClick={this.search}>
              Close and refresh results
            </Button>
          ) : (
            <Button onClick={this.hide}>Close</Button>
          )}
        </Modal.Footer>
      </Modal>
    )
  }
}
