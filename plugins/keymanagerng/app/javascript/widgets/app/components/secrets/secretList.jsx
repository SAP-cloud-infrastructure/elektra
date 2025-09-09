import React, { useCallback } from "react"
import { policy } from "lib/policy"
import SecretListItem from "./secretListItem"
import HintLoading from "../HintLoading"
import HintNotFound from "../HintNotFound"
import {
  DataGrid,
  DataGridRow,
  DataGridCell,
  DataGridHeadCell,
} from "@cloudoperators/juno-ui-components"

const SecretList = ({ secrets, isLoading }) => {
  return (
    <>
      {!policy.isAllowed("keymanagerng:secret_list") ? (
        <span>You are not allowed to see this page</span>
      ) : (
        <>
          {isLoading && !secrets ? (
            <HintLoading className="tw-mt-4" />
          ) : (
            <div className="datagrid-hover">
              <DataGrid
                columns={5}
                minContentColumns={[4]}
                data-target="secret-list-data-grid"
              >
                <DataGridRow>
                  <DataGridHeadCell>Name/ID</DataGridHeadCell>
                  <DataGridHeadCell>Type</DataGridHeadCell>
                  <DataGridHeadCell>Content Types</DataGridHeadCell>
                  <DataGridHeadCell>Status</DataGridHeadCell>
                  <DataGridHeadCell></DataGridHeadCell>
                </DataGridRow>
                {secrets && secrets.length > 0 ? (
                  secrets.map((secret, index) => (
                    <SecretListItem key={index} secret={secret} />
                  ))
                ) : (
                  <DataGridRow>
                    <DataGridCell colSpan={5}>
                      <HintNotFound text="No Secrets found." />
                    </DataGridCell>
                  </DataGridRow>
                )}
              </DataGrid>
            </div>
          )}
        </>
      )}
    </>
  )
}

export default SecretList
