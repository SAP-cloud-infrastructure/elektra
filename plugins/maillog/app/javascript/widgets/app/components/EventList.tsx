import React, { useState, useEffect, useMemo } from "react"
import { useAuthData, useAuthProject, useGlobalsEndpoint } from "./StoreProvider"
import { useGetData } from "../queries"
import { MailSearchOptions, MailLogEntry, HTTPError, NetworkError } from "../actions"
import Pagination from "./Pagination"
import {
  Message,
  Container,
  DataGrid,
  DataGridCell,
  DataGridHeadCell,
  DataGridRow,
} from "@cloudoperators/juno-ui-components"
import Item from "./Item"
import SearchBar from "./SearchBar"

const ITEMS_PER_PAGE = 15

interface PaginationOptions {
  pageSize: number
  page: number
}

interface SearchOptions {
  from: string
  subject: string
  rcpt: string[]
  id: string
  messageId: string
  headerFrom: string
  relay: string
}

interface DateOptions {
  start: Date | null
  end: Date | null
}

interface TableData {
  data: MailLogEntry[] | null
  hits: number | null
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  error: (HTTPError | NetworkError | Error) | null
}

interface EventListProps {
  props?: Record<string, unknown>
  onDataFetched?: (data: MailLogEntry[]) => void
}

const EventList: React.FC<EventListProps> = ({ props, onDataFetched }) => {
  const [paginationOptions, setPaginationOptions] = useState<PaginationOptions>({
    pageSize: ITEMS_PER_PAGE,
    page: 1,
  })
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    from: "",
    subject: "",
    rcpt: [],
    id: "",
    messageId: "",
    headerFrom: "",
    relay: "",
    // IncludeAttempts: true,
  })
  const [dateOptions, setDateOptions] = useState<DateOptions>({ start: null, end: null })
  const endpoint = useGlobalsEndpoint()
  const token = useAuthData()
  const project = useAuthProject()

  const mailSearchOptions: MailSearchOptions = {
    ...paginationOptions,
    ...searchOptions,
    ...dateOptions,
    project: project,
  }

  const fetchedData = useGetData(token, endpoint, mailSearchOptions)

  const [tableData, setTableData] = useState<TableData>({
    data: null,
    hits: null,
    isLoading: true,
    isError: false,
    isFetching: false,
    error: null,
  })

  const setDate = (date: DateOptions) => {
    setDateOptions({ ...date })
  }

  useEffect(() => {
    // Always update table data state to reflect current fetch status
    // This ensures error states and loading states are properly handled
    if (fetchedData) {
      const data = fetchedData.data?.data || null
      setTableData({
        data,
        hits: fetchedData.data?.hits || null,
        isLoading: fetchedData.isLoading,
        isError: fetchedData.isError,
        isFetching: fetchedData.isFetching,
        error: fetchedData.error,
      })
      // Notify parent component about the fetched data
      if (data && onDataFetched) {
        onDataFetched(data)
      }
    }
  }, [
    fetchedData.data,
    fetchedData.isLoading,
    fetchedData.isError,
    fetchedData.isFetching,
    fetchedData.error,
    onDataFetched,
  ])

  return useMemo(() => {
    return (
      <Container style={{ height: "100%" }}>
        <SearchBar
          onChange={setSearchOptions as any}
          onPageChange={setPaginationOptions as any}
          searchOptions={searchOptions}
          dateOptions={dateOptions}
          pageOptions={paginationOptions}
          onDateChange={setDate}
        />

        <>
          {tableData.error && (
            <Message variant="error" className="mb-4">
              {(tableData.error as HTTPError).statusCode >= 500 ? (
                <div>The server is experiencing issues. Please try again in a few moments.</div>
              ) : (tableData.error as HTTPError).statusCode === 401 ? (
                <div>Your session may have expired. Please refresh the page to re-authenticate.</div>
              ) : (
                <>
                  <h3>Unable to Load Mail Logs</h3>
                  <p>{tableData.error.message || tableData.error.toString()}</p>
                </>
              )}
            </Message>
          )}

          <Pagination
            hits={tableData.hits}
            pageOptions={paginationOptions}
            onChanged={setPaginationOptions}
            isFetching={tableData.isFetching}
            disabled={!!tableData.error}
          ></Pagination>
          <div className="datagrid-hover">
            <DataGrid columns={5}>
              <DataGridRow>
                <DataGridHeadCell>Time</DataGridHeadCell>
                <DataGridHeadCell>Envelope From</DataGridHeadCell>
                <DataGridHeadCell>Recipients</DataGridHeadCell>
                <DataGridHeadCell>Subject</DataGridHeadCell>
                <DataGridHeadCell></DataGridHeadCell>
              </DataGridRow>
              {tableData.data && tableData.data.length > 0 ? (
                tableData.data.map((itemData) => <Item data={itemData as any} key={itemData.id} />)
              ) : tableData.isLoading || tableData.isFetching ? (
                <DataGridRow>
                  <DataGridCell>Loading mail events...</DataGridCell>
                </DataGridRow>
              ) : (
                <DataGridRow>
                  <DataGridCell>No events found 🙂</DataGridCell>
                </DataGridRow>
              )}
            </DataGrid>
          </div>
        </>
      </Container>
    )
  }, [tableData, paginationOptions, searchOptions])
}
export default EventList
