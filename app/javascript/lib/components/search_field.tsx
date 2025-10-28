import { SearchInput } from "@cloudoperators/juno-ui-components"
import React, { useState, useEffect, useCallback, useRef } from "react"
import { Popover } from "./Overlay"

interface SearchFieldProps {
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  value?: string | null
  text?: string
  searchIcon?: boolean
  isFetching?: boolean
  variant?: string
}

const ElektraSearchField: React.FC<Omit<SearchFieldProps, "variant">> = ({
  onChange,
  placeholder,
  disabled,
  value = "",
  text,
  searchIcon,
  isFetching,
}) => {
  const [empty, setEmpty] = useState<boolean>(!value || value.trim().length === 0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle external value changes to support prop updates
  useEffect(() => {
    if (value !== null && inputRef.current) {
      inputRef.current.value = value
      setEmpty(!value || value.trim().length === 0)
    }
  }, [value])

  const onChangeTerm = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value || ""
      setEmpty(!newValue || newValue.trim().length === 0)
      onChange(newValue)
    },
    [onChange]
  )

  const reset = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setEmpty(true)
      if (inputRef?.current) inputRef.current.value = ""
      onChange("")
    },
    [onChange]
  )

  return (
    <>
      <div data-testid="search-wrapper" className="has-feedback has-feedback-searchable">
        <input
          data-testid="search"
          data-test="search"
          type="text"
          className="form-control"
          defaultValue={value || ""}
          placeholder={placeholder}
          onChange={onChangeTerm}
          disabled={disabled === true}
          ref={inputRef}
        />
        {isFetching ? (
          <span className="form-control-feedback">
            <i className="spinner" />
          </span>
        ) : empty ? (
          <span className="form-control-feedback">
            <i className={searchIcon !== false ? "fa fa-search" : ""} />
          </span>
        ) : (
          <span className="form-control-feedback not-empty" onClick={reset}>
            <i className="fa fa-times-circle" />
          </span>
        )}
      </div>
      {text && (
        <div className="has-feedback-help">
          <Popover trigger="click" placement="top" title="Info" content={text}>
            <a className="help-link" href="#" onClick={(e) => e.preventDefault()}>
              <i className="fa fa-question-circle"></i>
            </a>
          </Popover>
        </div>
      )}
    </>
  )
}

/**
 * This component implements a search field.
 * Usage: <SearchField placeholder='Name' text='Search by name' onChange={(term) => handleSearch}/>
 **/
export const SearchField: React.FC<SearchFieldProps> = ({ variant, ...props }) =>
  variant === "juno" ? (
    <SearchInput
      data-testid="search"
      value={props.value || ""} // Changed to value for controlled behavior
      placeholder={props.placeholder}
      disabled={props.disabled === true}
      onChange={(event) => props.onChange(event.target.value)}
      onClear={() => props.onChange("")}
    />
  ) : (
    <ElektraSearchField {...props} />
  )
