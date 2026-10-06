import React from "react"
import PropTypes from "prop-types"
import { Alert } from "react-bootstrap"

/**
 * This Component renders custom metadata tags.
 * the name of custom tags starts with meta_
 * @param {map} props
 * @returns component
 */
const CustomMetaTags = ({ values, onChange, reservedKeys }) => {
  const [error, setError] = React.useState()

  reservedKeys = reservedKeys || []
  // example of values:
  // [ { "key": "meta_key1", "value": "value1" } ]

  // filter out empty tags (key is empty)
  // and add a new entry for further tags
  const tags = React.useMemo(() => {
    if (!values) return []
    const result = values.slice().filter((v) => v.key && v.key.length > 0)
    result.push({ key: "", value: "" })
    return result
  }, [values])

  // update custom metadata tags
  // updates requires two params:
  // 1. identifier of the entry e.g. 0
  // 2. new key or new value or both of them
  // example: update(0, { "key": "xyz"})
  // example: update(1, { "value": "valueXYZ"})
  const update = React.useCallback(
    (index, { key, value }) => {
      let errors = []
      // do not allow to overwrite existing keys
      const oldKeys = tags.map((t) => t.key)
      if (!value && key && oldKeys.includes(key))
        errors.push("the key already exists")
      // do not allow to overwrite reserved keys
      if (reservedKeys.indexOf(key) >= 0) {
        errors.push("reserved key (will be ignored)")
      }
      setError(errors.length > 0 ? errors.join(", ") : null)

      const newValues = tags.slice()
      if (key !== undefined) newValues[index].key = key
      if (value !== undefined) newValues[index].value = value

      onChange(newValues)
    },
    [tags]
  )

  return (
    <>
      {reservedKeys && reservedKeys.length > 0 && (
        <div className="small">Reserved keys: {reservedKeys.join(", ")}</div>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      {tags.map((tag, i) => (
        <React.Fragment key={i}>
          <div className="input-group">
            <input
              type="text"
              data-test={`metaDataKey_${i}`}
              value={tag ? tag.key : ""}
              placeholder="Key"
              onChange={(e) => {
                e.preventDefault()
                update(i, { key: e.target.value })
              }}
              className="string optional form-control"
            />
            <div className="input-group-addon">=</div>
            <input
              type="text"
              data-test={`metaDataValue_${i}`}
              value={tag.value || ""}
              onChange={(e) => {
                e.preventDefault()
                update(i, { value: e.target.value })
              }}
              placeholder="Value"
              className="string optional form-control"
            />
          </div>
        </React.Fragment>
      ))}
    </>
  )
}

CustomMetaTags.propTypes = {
  values: PropTypes.array,
  onChange: PropTypes.func,
  reservedKeys: PropTypes.array,
}
export default CustomMetaTags
