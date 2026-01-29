import React from "react"
import {
  Button,
  Form,
  DateTimePicker,
  Select,
  SelectOption,
  TooltipTrigger,
  Tooltip,
  TooltipContent,
} from "@cloudoperators/juno-ui-components"
import moment from "moment"
import TooltipedInput from "./TooltipedInput"

const formStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "normal",
  marginTop: "15px",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 10,
}

const flexStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  flexShrink: 0,
  alignItems: "center",
  gap: 10,
}

interface SearchOptions {
  from: string
  subject: string
  rcpt: string[]
  id: string
  messageId: string
  headerFrom: string
  relay: string
  start: Date | null
  end: Date | null
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
  onChange: (options: Partial<SearchOptions>) => void
  searchOptions: SearchOptions
  onPageChange: (options: PageOptions) => void
  onDateChange: (date: DateOptions) => void
  pageOptions: PageOptions
  dateOptions: DateOptions
  className?: string
}

const SearchBar: React.FC<SearchBarProps> = ({
  children,
  onChange,
  searchOptions,
  onPageChange,
  onDateChange,
  pageOptions,
  dateOptions,
  className,
  ...props
}) => {
  const isValidDate = (date: string | Date) => date != "" && !moment(date).isAfter()
  const [reRender, setReRender] = React.useState(0)

  const handleSearchChanges = (newOptions: Partial<SearchOptions>) => {
    onChange({ ...searchOptions, ...newOptions })
    onPageChange({ ...pageOptions, page: 1 })
  }

  const handleDate = (date: DateOptions) => {
    onDateChange({ ...date })
  }

  const handleClear = () => {
    handleSearchChanges({
      from: "",
      subject: "",
      rcpt: [],
      messageId: "",
      headerFrom: "",
      id: "",
      relay: "",
      start: null,
      end: null,
    })
    setReRender(reRender + 1)
  }

  return (
    <>
      <Form style={formStyle} key={reRender}>
        <TooltipedInput
          tooltipContent="Search By Envelope From (Sender/From) Address"
          id="from"
          label="Envelope From"
          value={searchOptions.from}
          onChange={(e) => handleSearchChanges({ from: e.target.value })}
        />
        <TooltipedInput
          tooltipContent="Search By The HeaderFrom Field"
          id="headerFrom"
          label="Header From"
          value={searchOptions.headerFrom}
          onChange={(e) => handleSearchChanges({ headerFrom: e.target.value })}
        />
        <TooltipedInput
          tooltipContent="Search By Recipients, Separated By ','"
          id="rcpt"
          label="Recipients"
          value={searchOptions.rcpt.join(",")}
          onChange={(e) => handleSearchChanges({ rcpt: e.target.value.split(",") })}
        />
        <TooltipedInput
          tooltipContent="Search By Subject"
          id="subject"
          label="Subject"
          value={searchOptions.subject}
          onChange={(e) => handleSearchChanges({ subject: e.target.value })}
        />
        <TooltipedInput
          tooltipContent="Search By Message ID, Must Be Written As <MessageID>"
          id="messageId"
          label="Message ID"
          value={searchOptions.messageId}
          onChange={(e) => {
            let messageId = e.target.value.trim()
            handleSearchChanges({ messageId })
          }}
        />
        <TooltipedInput
          tooltipContent="Search By Request ID"
          placement={"bottom-start"}
          id="id"
          label="Request ID"
          value={searchOptions.id}
          onChange={(e) => handleSearchChanges({ id: e.target.value })}
        />
        <Tooltip triggerEvent="hover" placement={"bottom-start"}>
          <TooltipTrigger asChild>
            <div className="select-container ">
              <Select
                id="relay"
                placeholder="Select Relay"
                width="full"
                onChange={(value) => handleSearchChanges({ relay: String(value) })}
                onValueChange={(value) => handleSearchChanges({ relay: String(value) })}
              >
                <SelectOption value="aws" />
                <SelectOption value="esa" />
                <SelectOption value="esa_bulk" />
                <SelectOption value="int" />
                <SelectOption value="postfix" />
                <SelectOption value="null" />
                <SelectOption value="" label="All Relays" />
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent>Search By Relay</TooltipContent>
        </Tooltip>
        <div style={flexStyle}>
          <label style={{ flexShrink: 0 }}>Time Range (UTC):</label>
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
            label="Start Date"
            enableTime={true}
            time_24hr
          />
          &ndash;
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
            label="End Date"
            enableTime={true}
            time_24hr
          />
        </div>

        <Button
          onClick={handleClear}
          style={{
            right: "2rem",
            top: "1rem",
          }}
        >
          Clear All Filters
        </Button>
      </Form>
    </>
  )
}

export default SearchBar
