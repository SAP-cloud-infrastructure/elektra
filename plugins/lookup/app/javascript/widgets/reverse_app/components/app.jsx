import ObjectDetails from "../containers/objectDetails"
import { Form } from "lib/elektra-form"
import React from "react"

class App extends React.Component {
  state = {
    searchValue: "",
    searchedValue: "",
    error: null,
  }

  handleChange = (event) => {
    const newState = {}
    newState[event.currentTarget.name] = event.currentTarget.value
    this.setState(newState)
  }

  onSubmit = (event) => {
    event.preventDefault()
    this.setState({ error: null })
    this.setState({ searchedValue: this.state.searchValue })
    this.props.handleSubmit(this.state.searchValue).catch(({ errors }) => {
      this.setState({ error: errors })
    })
  }

  loadingDetails = () => {
    return (
      <>
        Loading details for <b>{this.state.searchedValue}</b>
      </>
    )
  }

  render() {
    return (
      <>
        <div className={this.props.modal ? "modal-body" : ""}>
          <form action="" className="form-horizontal">
            <Form.Errors errors={this.state.error} />
            <div className="mb-3">
              <label
                htmlFor="reverseLookupValue"
                className="col-sm-4 col-form-label"
              >
                Child Object
              </label>
              <div className="col-sm-6">
                <input
                  className="form-control"
                  name="searchValue"
                  id="reverseLookupValue"
                  type="text"
                  value={this.state.searchValue}
                  placeholder="Enter Child IP, DNS or Instance ID"
                  onChange={this.handleChange}
                />
              </div>
              <div className="col-sm-2">
                <button
                  className="btn btn-primary"
                  onClick={(e) => this.onSubmit(e)}
                  disabled={this.props.isFetching}
                >
                  {this.props.isFetching ? "Please wait..." : "Find Object"}
                </button>
              </div>
            </div>
          </form>
          {this.props.object.isFetching && (
            <div className="searchResults">
              {this.loadingDetails()}
              <span className="spinner" />
            </div>
          )}
          {this.props.object.error && (
            <>
              <div className="searchResults">{this.loadingDetails()}</div>
              <span className="text-danger">{this.props.object.error}</span>
            </>
          )}
          {this.props.object.data && (
            <ObjectDetails object={this.props.object} />
          )}
        </div>
        {this.props.modal && (
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              type="button"
              data-bs-dismiss="modal"
              aria-label="Cancel"
            >
              Cancel
            </button>
          </div>
        )}
      </>
    )
  }
}

export default App
