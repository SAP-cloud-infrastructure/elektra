import { AutocompleteField } from "lib/components/autocomplete_field"
import { FormErrors } from "lib/elektra-form/components/form_errors"
import React from "react"

export default class ImageMemberForm extends React.Component {
  state = {
    selected: null,
    errors: null,
    isSubmitting: false,
  }

  handleSelected = (item) => {
    this.setState({ selected: item })
  }

  handleSubmit = () => {
    let item = this.state.selected && this.state.selected[0]
    this.setState({ isSubmitting: true })
    this.props
      .handleSubmit(item.id)
      .then((data) => this.setState({ isSubmitting: false }))
      .catch((errors) => this.setState({ errors, isSubmitting: false }))
  }

  render() {
    return (
      <>
        {this.state.errors && <FormErrors errors={this.state.errors} />}
        <div className="input-group">
          <AutocompleteField
            type="projects"
            onSelected={this.handleSelected}
            onInputChange={(id) => this.handleSelected([{ id }])}
          />
          <span className="input-group-btn">
            <button
              className="btn btn-primary"
              type="button"
              onClick={this.handleSubmit}
              disabled={this.state.isSubmitting}
            >
              {this.state.isSubmitting
                ? "...Please wait"
                : this.props.buttonLabel || "Add"}
            </button>
          </span>
        </div>
        <p className="form-text">
          <i className="fa fa-info-circle"></i>
          Project (name or ID) with whom the image is shared
        </p>
      </>
    )
  }
}
