import React from "react"
import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Form } from "lib/elektra-form"
import { Link } from "react-router-dom"
import { Typeahead, Highlighter } from "react-bootstrap-typeahead"
import { useContext } from "react"

const FormBody = ({ values, loadNextServers, servers }) => {
  const options = () => {
    if (!servers || !servers.items) return []
    return servers.items.filter(
      (item) => item["OS-EXT-AZ:availability_zone"] == values.availability_zone
    )
  }
  let maxResults = (servers && servers.perPage) || 100
  if (servers && servers.hasNext) maxResults = maxResults - 1

  const context = useContext(Form.Context)

  return (
    <Modal.Body>
      <Form.Errors />

      <p className="alert alert-info">
        Please enter a server ID or select a server from the list when clicking
        on the input field. Note that only servers with the Availability Zone{" "}
        <b>{values.availability_zone}</b> can be attached.
      </p>

      <Form.ElementHorizontal label="Server ID" name="server_id" required>
        <Typeahead
          id="server_id"
          onPaginate={(e) => {
            e.preventDefault()
            loadNextServers()
          }}
          options={options()}
          onChange={(items) => context.onChange("server_id", items[0].id)}
          onInputChange={(id) => context.onChange("server_id", id)}
          paginate={servers && servers.hasNext}
          maxResults={0}
          paginationText={"Load next servers..."}
          labelKey="name"
          emptyLabel={servers.isFetching ? "Loading..." : "No matches found."}
          filterBy={["id", "name"]}
          placeholder="Pick a server or enter a server ID"
          renderMenuItemChildren={(option, props, index) => {
            return [
              <Highlighter key="name" search={props.text}>
                {option.name}
              </Highlighter>,
              <div className="info-text" key="id">
                <small>ID: {option.id}</small>
              </div>,
            ]
          }}
        />
      </Form.ElementHorizontal>
    </Modal.Body>
  )
}

export default class AttachVolumeForm extends React.Component {
  state = { show: true }

  componentDidMount() {
    if (!this.props.volume) {
      this.props.loadVolume().catch((loadError) => this.setState({ loadError }))
    }

    if (
      !this.props.servers.isFetching &&
      this.props.servers.items.length == 0
    ) {
      this.props.loadNextServers()
    }
  }

  validate = (values) => {
    return values.server_id && true
  }

  close = (e) => {
    if (e) e.stopPropagation()
    this.setState({ show: false })
  }

  restoreUrl = (e) => {
    if (!this.state.show) this.props.history.replace(`/volumes`)
  }

  onSubmit = (values) => {
    return this.props.attachVolume(values).then(() => this.close())
  }

  render() {
    const initialValues = this.props.volume
      ? {
          name: this.props.volume.name,
          availability_zone: this.props.volume.availability_zone,
        }
      : {}

    return (
      <Modal
        show={this.state.show}
        onHide={this.close}
        bsSize="large"
        backdrop="static"
        onExited={this.restoreUrl}
        aria-labelledby="contained-modal-title-lg"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-lg">
            Attach Volume{" "}
            <span className="info-text">
              {initialValues.name || this.props.id}
            </span>
          </Modal.Title>
        </Modal.Header>

        <Form
          className="form form-horizontal"
          validate={this.validate}
          onSubmit={this.onSubmit}
          initialValues={initialValues}
        >
          {this.props.volume ? (
            <FormBody
              servers={this.props.servers}
              loadNextServers={this.props.loadNextServers}
            />
          ) : (
            <Modal.Body>
              <span className="spinner"></span>
              Loading...
            </Modal.Body>
          )}

          <Modal.Footer>
            <Button onClick={this.close}>Cancel</Button>
            <Form.SubmitButton label="Attach" />
          </Modal.Footer>
        </Form>
      </Modal>
    )
  }
}
