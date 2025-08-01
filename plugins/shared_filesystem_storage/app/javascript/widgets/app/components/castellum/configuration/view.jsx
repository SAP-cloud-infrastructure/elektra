import { Link } from "react-router-dom"
import React from "react"

const percent = (val) => {
  return `${val}\u{00A0}%`
}

const duration = (val) => {
  let unit = "second"
  if (val % 60 == 0) {
    val /= 60
    unit = "minute"
  }
  if (val % 60 == 0) {
    val /= 60
    unit = "hour"
  }
  if (val != 1) {
    unit += "s"
  }
  return `${val}\u{00A0}${unit}`
}

const selectOptions = [
  { value: true, label: "All" },
  { value: false, label: "Individual" },
]
export default class CastellumConfigurationView extends React.Component {
  constructor(props) {
    super(props)
    const { allShares } = this.props.config
    const selected = selectOptions.find((option) => option.value === allShares)
    const defaultSelection = selectOptions[0].label
    this.state = {
      defaultSelection,
      selected: selected ? selected.label : defaultSelection,
    }
  }

  componentDidMount() {
    const { allShares } = this.props.config
    if (allShares == false) {
      this.props.loadShareTypesOnce()
    }
  }

  handleSelectChange = (event, configMap) => {
    const selectedLabel = event.target.value
    const selectedOption = selectOptions.find((option) => option.label === selectedLabel)
    const hasAnyConfigs = Object.values(configMap).some((value) => !!value)

    if (hasAnyConfigs) {
      const shareTypes = Object.keys(configMap)
      this.props.disableAutoscaling(this.props.projectID, shareTypes, selectedOption.value)
    } else {
      this.props.loadShareTypesOnce()
      this.setState({ selected: selectedLabel })
    }
  }

  render() {
    const props = this.props
    const { data: configMap } = this.props.config
    const { items: shareTypeItems, isFetching } = this.props.shareTypes

    if (isFetching) {
      return (
        <p>
          <span className="spinner" /> Loading...
        </p>
      )
    }

    const autoScalingOptions = (
      <div className="tw-flex tw-items-center tw-space-x-2">
        <span>Create autoscaling config for</span>
        <select
          id="scalingOptions"
          className="select form-control tw-w-48"
          value={this.state.selected}
          onChange={(e) => {
            this.handleSelectChange(e, configMap)
          }}
        >
          {selectOptions.map((option) => (
            <option key={option.label}>{option.label}</option>
          ))}
        </select>
        <span>share types.</span>
      </div>
    )

    function renderConfigForAll() {
      const config = configMap["nfs-shares"]
      return <CastellumConfigurationViewDetails {...props} config={config} shareType={"nfs-shares"} />
    }

    function renderIndividualConfig() {
      return shareTypeItems.map((shareType) => {
        const key = `nfs-shares-type:${shareType.name}`
        const shareConfig = configMap[key]
        return (
          <div key={shareType.name} className="tw-mt-4">
            <h5>{shareType.name}</h5>
            <CastellumConfigurationViewDetails {...props} config={shareConfig} shareType={key} />
          </div>
        )
      })
    }

    return (
      <div>
        <div>{autoScalingOptions}</div>
        {this.state.selected == this.state.defaultSelection ? renderConfigForAll() : renderIndividualConfig()}
      </div>
    )
  }
}

class CastellumConfigurationViewDetails extends React.Component {
  render() {
    const config = this.props.config

    if (config == null) {
      return (
        <>
          <p>Autoscaling is not enabled for this project.</p>
          <p>
            <Link to={`/autoscaling/configure/${this.props.shareType}`} className="btn btn-primary">
              Configure
            </Link>
          </p>
        </>
      )
    }

    return (
      <>
        <p>Autoscaling is enabled:</p>
        <ul>
          {config.low_threshold && (
            <li>
              Shares will be shrunk when usage is below <strong>{percent(config.low_threshold.usage_percent)}</strong>{" "}
              for <strong>{duration(config.low_threshold.delay_seconds)}</strong>.
            </li>
          )}
          {config.high_threshold && (
            <li>
              Shares will be extended when usage exceeds <strong>{percent(config.high_threshold.usage_percent)}</strong>{" "}
              {config.size_constraints &&
                config.size_constraints.minimum_free &&
                !config.size_constraints.minimum_free_is_critical && (
                  <>
                    (or when free space is below <strong>{config.size_constraints.minimum_free} GiB</strong>)
                  </>
                )}{" "}
              for <strong>{duration(config.high_threshold.delay_seconds)}</strong>.
            </li>
          )}
          {(config.critical_threshold || config.size_constraints.minimum_free_is_critical) && (
            <li>
              Shares will be extended immediately{" "}
              {config.critical_threshold && (
                <>
                  when usage exceeds <strong>{percent(config.critical_threshold.usage_percent)} </strong>
                </>
              )}
              {config.size_constraints.minimum_free_is_critical && (
                <>
                  {config.critical_threshold && <>or </>}
                  when free space is below <strong>{config.size_constraints.minimum_free} GiB</strong>
                </>
              )}
              .
            </li>
          )}
        </ul>
        <p>
          Shares will be resized{" "}
          {config.size_steps.single ? (
            <>
              using{" "}
              <a
                href="https://github.com/sapcc/castellum/blob/master/docs/api-spec.md#stepping-strategies"
                target="_blank"
                rel="noreferrer"
              >
                single-step resizing
              </a>
            </>
          ) : (
            <>
              in steps of <strong>{percent(config.size_steps.percent)}</strong>
            </>
          )}
          {config.size_constraints ? ", but..." : "."}
        </p>
        {config.size_constraints && (
          <ul>
            {config.size_constraints.minimum && (
              <li>
                ...never to a total size below <strong>{config.size_constraints.minimum} GiB</strong>.
              </li>
            )}
            {config.size_constraints.maximum && (
              <li>
                ...never to a total size above <strong>{config.size_constraints.maximum} GiB</strong>.
              </li>
            )}
            {config.size_constraints.minimum_free && (
              <li>
                ...never below <strong>{config.size_constraints.minimum_free} GiB</strong> of free space.
              </li>
            )}
          </ul>
        )}
        <p>
          <Link to={`/autoscaling/configure/${this.props.shareType}`} className="btn btn-primary">
            Configure
          </Link>{" "}
          <button
            className="btn btn-danger"
            onClick={() => this.props.disableAutoscaling(this.props.projectID, [this.props.shareType])}
          >
            Disable autoscaling
          </button>
        </p>
      </>
    )
  }
}
