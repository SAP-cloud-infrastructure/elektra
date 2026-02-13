import React, { useEffect, useRef } from "react"
import {
  Button,
  Form,
  FormRow,
  DateTimePicker,
  Select,
  SelectOption,
  ButtonRow,
  TextInput,
  Grid,
  GridRow,
  GridColumn,
} from "@cloudoperators/juno-ui-components"
import moment from "moment"

interface SearchOptions {
  from: string
  subject: string
  rcpt: string[]
  id: string
  messageId: string
  headerFrom: string
  relay: string
}

interface PageOptions {
  page: number
  pageSize: number
}

interface DateOptions {
  start?: Date | null
  end?: Date | null
}

interface SearchBarProps {
  children?: React.ReactNode
  onChange: (options: Partial<SearchOptions>, resetPage?: boolean) => void
  searchOptions: SearchOptions
  onPageChange: (options: PageOptions) => void
  onDateChange: (date: DateOptions) => void
  pageOptions: PageOptions
  dateOptions: DateOptions
  className?: string
}

const SearchBar: React.FC<SearchBarProps> = ({ onChange, searchOptions, onPageChange, onDateChange, pageOptions }) => {
  const isValidDate = (date: string | Date) => date != "" && !moment(date).isAfter()
  const [formKey, setFormKey] = React.useState(0)
  const [localSearchOptions, setLocalSearchOptions] = React.useState<SearchOptions>(searchOptions)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Update local state when searchOptions prop changes (e.g., from clear)
  useEffect(() => {
    setLocalSearchOptions(searchOptions)
  }, [searchOptions])

  const handleSearchChanges = (newOptions: Partial<SearchOptions>) => {
    // Update local state immediately for responsive UI
    const updatedOptions = { ...localSearchOptions, ...newOptions }
    setLocalSearchOptions(updatedOptions)

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer to trigger actual search after 500ms
    debounceTimerRef.current = setTimeout(() => {
      onChange({ ...searchOptions, ...newOptions }, true)
      onPageChange({ ...pageOptions, page: 1 })
    }, 500)
  }

  const handleDate = (date: DateOptions) => {
    onDateChange(date)
  }

  const handleClear = () => {
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    const clearedOptions = {
      from: "",
      subject: "",
      rcpt: [],
      messageId: "",
      headerFrom: "",
      id: "",
      relay: "",
    }

    setLocalSearchOptions(clearedOptions)
    onChange({ ...searchOptions, ...clearedOptions }, true)
    onPageChange({ ...pageOptions, page: 1 })
    handleDate({ start: null, end: null })
    // Force form re-render to clear all inputs
    setFormKey((prev) => prev + 1)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <Form key={formKey}>
      <Grid>
        <GridRow>
          <GridColumn cols={4}>
            <FormRow>
              <TextInput
                id="from"
                label="From"
                helptext="Search by sender email address"
                value={localSearchOptions.from}
                onChange={(e) => handleSearchChanges({ from: e.target.value })}
              />
            </FormRow>
          </GridColumn>
          <GridColumn cols={4}>
            <FormRow>
              <TextInput
                id="headerFrom"
                label="Header From"
                helptext="Search by header from field"
                value={localSearchOptions.headerFrom}
                onChange={(e) => handleSearchChanges({ headerFrom: e.target.value })}
              />
            </FormRow>
          </GridColumn>
          <GridColumn cols={4}>
            <FormRow>
              <TextInput
                id="rcpt"
                label="Recipients"
                helptext="Search by recipients, separated by ','"
                value={localSearchOptions.rcpt.join(",")}
                onChange={(e) => handleSearchChanges({ rcpt: e.target.value.split(",") })}
              />
            </FormRow>
          </GridColumn>
        </GridRow>

        <GridRow>
          <GridColumn cols={4}>
            <FormRow>
              <TextInput
                id="subject"
                label="Subject"
                helptext="Search by subject"
                value={localSearchOptions.subject}
                onChange={(e) => handleSearchChanges({ subject: e.target.value })}
              />
            </FormRow>
          </GridColumn>
          <GridColumn cols={4}>
            <FormRow>
              <TextInput
                id="messageId"
                label="Message ID"
                helptext="Search by message ID, must be written as <MessageID>"
                value={localSearchOptions.messageId}
                onChange={(e) => {
                  let messageId = e.target.value.trim()
                  handleSearchChanges({ messageId })
                }}
              />
            </FormRow>
          </GridColumn>
          <GridColumn cols={4}>
            <FormRow>
              <TextInput
                id="id"
                label="Request ID"
                helptext="Search by request ID"
                value={localSearchOptions.id}
                onChange={(e) => handleSearchChanges({ id: e.target.value })}
              />
            </FormRow>
          </GridColumn>
        </GridRow>

        <GridRow>
          <GridColumn cols={4}>
            <FormRow>
              <Select
                id="relay"
                label="Relay"
                placeholder="Select Relay"
                width="full"
                value={localSearchOptions.relay}
                onChange={(value) => handleSearchChanges({ relay: String(value) })}
                onValueChange={(value) => handleSearchChanges({ relay: String(value) })}
                helptext="Search By Relay"
              >
                <SelectOption value="aws" label="AWS" />
                <SelectOption value="esa" label="ESA" />
                <SelectOption value="esa_bulk" label="ESA Bulk" />
                <SelectOption value="int" label="INT" />
                <SelectOption value="postfix" label="Postfix" />
                <SelectOption value="null" label="Null" />
                <SelectOption value="" label="All Relays" />
              </Select>
            </FormRow>
          </GridColumn>
          <GridColumn cols={4}>
            <FormRow>
              <DateTimePicker
                onChange={(value) => {
                  if (Array.isArray(value) && value.length > 0) {
                    const dateValue = value[0]
                    handleDate({
                      start: dateValue && !isNaN(new Date(dateValue).getTime()) ? new Date(dateValue) : null,
                    })
                  } else {
                    handleDate({ start: null })
                  }
                }}
                id="start"
                label="Start Date (UTC)"
                helptext="Select the start date and time for the search range"
                enableTime={true}
                time_24hr
              />
            </FormRow>
          </GridColumn>
          <GridColumn cols={4}>
            <FormRow>
              <DateTimePicker
                onChange={(value) => {
                  if (Array.isArray(value) && value.length > 0) {
                    const dateValue = value[0]
                    handleDate({
                      end: dateValue && !isNaN(new Date(dateValue).getTime()) ? new Date(dateValue) : null,
                    })
                  } else {
                    handleDate({ end: null })
                  }
                }}
                id="end"
                label="End Date (UTC)"
                helptext="Select the end date and time for the search range"
                enableTime={true}
                time_24hr
              />
            </FormRow>
          </GridColumn>
        </GridRow>
      </Grid>

      <ButtonRow>
        <Button onClick={handleClear} variant="subdued">
          Clear All Filters
        </Button>
      </ButtonRow>
    </Form>
  )
}

export default SearchBar
