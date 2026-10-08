import React from "react"
import { Form } from "lib/elektra-form"
import { PLATFORM_FILTER_OPTIONS, DEFAULT_PLATFORM_FILTER_KEY } from "../../constants"

// Returns the form element to select a platform filter based on configured options.
export const PlatformFilterSelect = ({ value }) => {
  return (
    <Form.ElementHorizontal label="Platform filter" name="platform_filter">
      <Form.Input elementType="select" name="platform_filter">
        {Object.entries(PLATFORM_FILTER_OPTIONS).map(([key, opt]) => (
          <option key={key} value={key}>
            {opt.label}
          </option>
        ))}
      </Form.Input>
      <p className="form-control-static">
        When replicating multi-architecture images, a platform filter restricts which parts get replicated.
      </p>
      {PLATFORM_FILTER_OPTIONS[value]?.infoText && (
        <p className="text-info">
          <i className="fa fa-info-circle" /> {PLATFORM_FILTER_OPTIONS[value].infoText}
        </p>
      )}
    </Form.ElementHorizontal>
  )
}

// For the initial form filter setting, always returns a valid key
export const getPlatformFilterKeyForForm = (platformFilter) => {
  return getPlatformFilterKey(platformFilter) || DEFAULT_PLATFORM_FILTER_KEY
}

// Helper to get the account display text
export const getPlatformFilterDisplayText = (platformFilter) => {
  const key = getPlatformFilterKey(platformFilter)
  return key !== null ? PLATFORM_FILTER_OPTIONS[key].displayText : ", with custom platform filter for multi-arch images"
}

// Helper to convert the API value to the filter key
const getPlatformFilterKey = (platformFilter) => {
  if (!Array.isArray(platformFilter) || platformFilter.length === 0) {
    return DEFAULT_PLATFORM_FILTER_KEY
  }
  const pf = platformFilter
  const matchedEntry = Object.entries(PLATFORM_FILTER_OPTIONS).find(
    ([_key, opt]) =>
      opt.value &&
      opt.value.length === pf.length &&
      opt.value.every((v) => pf.some((p) => v.os === p.os && v.architecture === p.architecture))
  )
  return matchedEntry?.[0] || null
}
