import React, { useState, useEffect, useMemo } from "react"
import { useAuthData, useAuthProject, useGlobalsEndpoint } from "./StoreProvider"
import { useGetData } from "../queries"
import Pagination from "./Pagination"
import { Container, DataGrid, DataGridCell, DataGridHeadCell, DataGridRow } from "@cloudoperators/juno-ui-components"
import HintLoading from "./HintLoading"
import Item from "./Item"
import SearchBar from "./SearchBar"

const ITEMS_PER_PAGE = 15

const EventList = ({ props }) => {
  const [paginationOptions, setPaginationOptions] = useState({
    pageSize: ITEMS_PER_PAGE,
    page: 1,
  })
  const [searchOptions, setSearchOptions] = useState({
    from: "",
    subject: "",
    rcpt: [],
    id: "",
    messageId: "",
    headerFrom: "",
    relay: "",
    // IncludeAttempts: true,
  })
  const [dateOptions, setDateOptions] = useState({ start: null, end: null })
  const endpoint = useGlobalsEndpoint()
  const token = useAuthData()
  const project = useAuthProject()

  const fetchedData = useGetData(token, endpoint, {
    ...paginationOptions,
    ...searchOptions,
    ...dateOptions,
    project: project,
  })

  const [tableData, setTableData] = useState({
    data: null,
    hits: null,
    isLoading: true,
    isError: false,
    isFetching: false,
    error: null,
  })

  const setDate = (date) => {
    setDateOptions({ ...date })
  }

  useEffect(() => {
    // Always update table data state to reflect current fetch status
    // This ensures error states and loading states are properly handled
    if (fetchedData) {
      setTableData({
        data: fetchedData.data?.data || null,
        hits: fetchedData.data?.hits || null,
        isLoading: fetchedData.isLoading,
        isError: fetchedData.isError,
        isFetching: fetchedData.isFetching,
        error: fetchedData.error,
      })
    }
  }, [fetchedData.data, fetchedData.isLoading, fetchedData.isError, fetchedData.isFetching, fetchedData.error])
  return useMemo(() => {
    return (
      <Container style={{ height: "100%" }}>
        <SearchBar
          onChange={setSearchOptions}
          onPageChange={setPaginationOptions}
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
            />
            <DataGrid columns={6}>
              <DataGridRow>
                <DataGridHeadCell></DataGridHeadCell>
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
                      gridColumn: "span 6 / span 6",
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
                      {tableData.error.statusCode >= 500 && (
                        <p style={{ fontSize: "0.9rem", color: "#666" }}>
                          The server is experiencing issues. Please try again in a few moments.
                        </p>
                      )}
                      {tableData.error.statusCode === 401 && (
                        <p style={{ fontSize: "0.9rem", color: "#666" }}>
                          Your session may have expired. Please refresh the page to re-authenticate.
                        </p>
                      )}
                    </div>
                  </DataGridCell>
                </DataGridRow>
              ) : tableData.data && tableData.data.length > 0 ? (
                tableData.data.map((itemData) => <Item data={itemData} key={itemData.id} />)
              ) : (
                // Your no events found message here
                <DataGridRow>
                  <DataGridCell
                    style={{
                      alignItems: "center",
                      gridColumn: "span 6 / span 6",
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
          </>
        )}
      </Container>
    )
  }, [tableData, paginationOptions, searchOptions])
}
export default EventList
