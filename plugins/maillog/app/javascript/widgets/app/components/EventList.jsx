import React, { useState, useEffect, useMemo } from "react";
import {
  useAuthData,
  useAuthProject,
  useGlobalsEndpoint,
} from "./StoreProvider";
import { useGetData } from "../queries";
import Pagination from "./Pagination";
import {
  Container,
  DataGrid,
  DataGridCell,
  DataGridHeadCell,
  DataGridRow,
} from "@cloudoperators/juno-ui-components";
import HintLoading from "./HintLoading";
import Item from "./Item";
import SearchBar from "./SearchBar";

const ITEMS_PER_PAGE = 15;

const EventList = ({ props }) => {
  const [paginationOptions, setPaginationOptions] = useState({
    pageSize: ITEMS_PER_PAGE,
    page: 1,
  });
  const [searchOptions, setSearchOptions] = useState({
    from: "",
    subject: "",
    rcpt: [],
    id: "",
    messageId: "",
    headerFrom: "",
    relay: "",
    // IncludeAttempts: true,
  });
  const [dateOptions, setDateOptions] = useState({ start: null, end: null });
  const endpoint = useGlobalsEndpoint();
  const token = useAuthData();
  const project = useAuthProject();

  const fetchedData = useGetData(token, endpoint, {
    ...paginationOptions,
    ...searchOptions,
    ...dateOptions,
    project: project,
  });

  const [tableData, setTableData] = useState({
    data: null,
    hits: null,
    isLoading: true,
    isError: false,
    isFetching: false,
    error: null,
  });

  const setDate = (date) => {
    setDateOptions({ ...date });
  };

  useEffect(() => {
    if (fetchedData && fetchedData.data) {
      setTableData({
        data: fetchedData.data.data,
        hits: fetchedData.data.hits,
        isLoading: fetchedData.isLoading,
        isError: fetchedData.isError,
        isFetching: fetchedData.isFetching,
        error: fetchedData.error,
      });
    }
  }, [fetchedData.data]);
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
                // Your error handling here
                <DataGridRow>
                  <DataGridCell>{tableData.error}</DataGridCell>
                </DataGridRow>
              ) : tableData.data && tableData.data.length > 0 ? (
                tableData.data.map((itemData) => (
                  <Item data={itemData} key={itemData.id} />
                ))
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
    );
  }, [tableData, paginationOptions, searchOptions]);
};
export default EventList;
