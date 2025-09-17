import React, { useState } from "react"
import { policy } from "lib/policy"
import OrderListItem from "./orderListItem"
import HintLoading from "../HintLoading"

import {
  DataGrid,
  DataGridRow,
  DataGridCell,
  DataGridHeadCell,
} from "@cloudoperators/juno-ui-components"

const OrderList = ({ orders, isLoading, resetSearch, refreshSearch }) => {

  return (
    <>
      {!policy.isAllowed("keymanagerng:order_list") ? (
        <span>You are not allowed to see this page</span>
      ) : (
        <>
          {isLoading && !orders ? (
            <HintLoading className="tw-mt-4" />
          ) : (
            <DataGrid columns={4} minContentColumns={[3]}>
              <DataGridRow>
                <DataGridHeadCell>Name/ID</DataGridHeadCell>
                <DataGridHeadCell>Type</DataGridHeadCell>
                <DataGridHeadCell>Status</DataGridHeadCell>
                <DataGridHeadCell></DataGridHeadCell>
              </DataGridRow>
              {orders && orders.length > 0 ? (
                orders.map((order, index) => (
                  <OrderListItem key={index} order={order} resetSearch={resetSearch} refreshSearch={refreshSearch} />
                ))
              ) : (
                <DataGridRow>
                  <DataGridCell colSpan={4}>No Orders found.</DataGridCell>
                </DataGridRow>
              )}
            </DataGrid>
          )}
        </>
      )}
    </>
  )
}

export default OrderList
