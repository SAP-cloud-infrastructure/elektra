import { connect } from "react-redux"
import CastellumOperationsList from "../../components/castellum/operations_list"
import { fetchCastellumDataIfNeeded } from "../../actions/castellum"
import { deleteShare, forceDeleteShare } from "../../actions/shares"
import { CASTELLUM_PENDING } from "../../constants"

const path = CASTELLUM_PENDING.endpoint
export default connect(
  (state) => ({
    operations: (state.castellum || {})[CASTELLUM_PENDING.key],
    shares: (state.shares || {}).items,
  }),
  (dispatch) => ({
    loadOpsOnce: (projectID) =>
      dispatch(fetchCastellumDataIfNeeded(projectID, path.concat(`?project=${projectID}`), "pending_operations")),
    handleDelete: (shareID) => dispatch(deleteShare(shareID)),
    handleForceDelete: (shareID) => dispatch(forceDeleteShare(shareID)),
  })
)(CastellumOperationsList)
