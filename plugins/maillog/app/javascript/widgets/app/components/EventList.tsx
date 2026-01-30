import React, { useState, useEffect, useMemo } from "react"
import { useAuthData, useAuthProject, useGlobalsEndpoint } from "./StoreProvider"
import { useGetData } from "../queries"
import { MailSearchOptions, MailLogEntry, HTTPError, NetworkError } from "../actions"
import Pagination from "./Pagination"
import {
  Container,
  DataGrid,
  DataGridCell,
  DataGridHeadCell,
  DataGridRow,
  Spinner,
} from "@cloudoperators/juno-ui-components"
import HintLoading from "./HintLoading"
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
        {/* @ts-expect-error - SearchBar is a JSX component without proper TypeScript definitions */}
        <SearchBar
          onChange={setSearchOptions as any}
          onPageChange={setPaginationOptions as any}
          searchOptions={searchOptions}
          dateOptions={dateOptions}
          pageOptions={paginationOptions}
          onDateChange={setDate}
        />

        {tableData.isLoading && !tableData.data ? (
          <HintLoading text="Loading Logs..." />
        ) : (
          <>
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
                {tableData.error ? (
                  // Error handling with user-friendly messages
                  <DataGridRow>
                    <DataGridCell
                      style={{
                        alignItems: "center",
                        gridColumn: "span 5 / span 5",
                        height: "50vh",
                        fontSize: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: "1rem",
                      }}
                    >
                      <div
                        style={{
                          padding: "2rem",
                          backgroundColor: "#fee",
                          border: "1px solid #fcc",
                          borderRadius: "4px",
                          maxWidth: "600px",
                        }}
                      >
                        <h3 style={{ marginTop: 0, color: "#c00" }}>Unable to Load Mail Logs</h3>
                        <p style={{ margin: "1rem 0" }}>{tableData.error.message || tableData.error.toString()}</p>
                        {(tableData.error as HTTPError).statusCode >= 500 && (
                          <p style={{ fontSize: "0.9rem", color: "#666" }}>
                            The server is experiencing issues. Please try again in a few moments.
                          </p>
                        )}
                        {(tableData.error as HTTPError).statusCode === 401 && (
                          <p style={{ fontSize: "0.9rem", color: "#666" }}>
                            Your session may have expired. Please refresh the page to re-authenticate.
                          </p>
                        )}
                      </div>
                    </DataGridCell>
                  </DataGridRow>
                ) : tableData.data && tableData.data.length > 0 ? (
                  tableData.data.map((itemData) => (
                    // @ts-expect-error - Item is a JSX component without proper TypeScript definitions
                    <Item data={itemData as any} key={itemData.id} />
                  ))
                ) : (
                  // Your no events found message here
                  <DataGridRow>
                    <DataGridCell
                      style={{
                        alignItems: "center",
                        gridColumn: "span 5 / span 5 ",
                        height: "100vh",
                        fontSize: "1.2rem",
                      }}
                    >
                      No events found
                    </DataGridCell>
                  </DataGridRow>
                )}
                {tableData.isFetching && !tableData.data && (
                  // Your loading spinner here
                  <DataGridRow>
                    <DataGridCell>
                      <span className="spinner" />
                    </DataGridCell>
                  </DataGridRow>
                )}
              </DataGrid>
            </div>
          </>
        )}
      </Container>
    )
  }, [tableData, paginationOptions, searchOptions])
}
export default EventList
