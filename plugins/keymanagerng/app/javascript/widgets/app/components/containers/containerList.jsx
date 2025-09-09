import React, { useState } from "react"
import { policy } from "lib/policy"
import ContainerListItem from "./containerListItem"
import HintLoading from "../HintLoading"

import {
  DataGrid,
  DataGridRow,
  DataGridCell,
  DataGridHeadCell,
} from "@cloudoperators/juno-ui-components"

const ContainerList = ({ containers, isLoading, resetSearch, refreshSearch }) => {
  return (
    <>
      {!policy.isAllowed("keymanagerng:container_list") ? (
        <span>You are not allowed to see this page</span>
      ) : (
        <>
          {isLoading && !containers ? (
            <HintLoading className="tw-mt-4" />
          ) : (
            <DataGrid columns={4} minContentColumns={[3]}>
              <DataGridRow>
                <DataGridHeadCell>Name/ID</DataGridHeadCell>
                <DataGridHeadCell>Type</DataGridHeadCell>
                <DataGridHeadCell>Status</DataGridHeadCell>
                <DataGridHeadCell></DataGridHeadCell>
              </DataGridRow>
              {containers && containers.length > 0 ? (
                containers.map((container, index) => (
                  <ContainerListItem key={index} container={container} resetSearch={resetSearch} refreshSearch={refreshSearch} />
                ))
              ) : (
                <DataGridRow>
                  <DataGridCell colSpan={4}>No Containers found.</DataGridCell>
                </DataGridRow>
              )}
            </DataGrid>
          )}
        </>
      )}
    </>
  )
}

export default ContainerList
