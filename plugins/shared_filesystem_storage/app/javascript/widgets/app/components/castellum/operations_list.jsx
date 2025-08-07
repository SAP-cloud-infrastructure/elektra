import { DataTable } from "lib/components/datatable"
import { columns, CastellumOperation } from "./operation"
import React from "react"

export default class CastellumOperationsList extends React.Component {
  componentDidMount() {
    this.props.loadOpsOnce(this.props.projectID)
  }

  render() {
    const { errorMessage, isFetching, data } = this.props.operations
    if (isFetching) {
      return (
        <p>
          <span className="spinner" /> Loading...
        </p>
      )
    }
    if (errorMessage) {
      return (
        <p className="alert alert-danger">
          Cannot load operations: {errorMessage}
        </p>
      )
    }

    const operations = data || []
    const shares = this.props.shares || []

    const forwardProps = {
      handleDelete: this.props.handleDelete,
      handleForceDelete: this.props.handleForceDelete,
    }

    return (
      <DataTable columns={columns} pageSize={6}>
        {operations.map((operation) => (
          <CastellumOperation
            key={operation.asset_id}
            operation={operation}
            share={shares.find((share) => share.id == operation.asset_id)}
            {...forwardProps}
          />
        ))}
      </DataTable>
    )
  }
}
