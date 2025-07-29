import { connect } from "react-redux"
import CastellumConfigurationView from "../../../components/castellum/configuration/view"
import { disableAutoscaling } from "../../../actions/castellum"
import { fetchShareTypesIfNeeded } from "../../../actions/share_types"

export default connect(
  (state) => ({
    config: (state.castellum || {})["resources"],
    shareTypes: state.shareTypes,
  }),
  (dispatch) => ({
    disableAutoscaling: (projectID, shareType) => dispatch(disableAutoscaling(projectID, shareType)),
    loadShareTypesOnce: () => dispatch(fetchShareTypesIfNeeded()),
  })
)(CastellumConfigurationView)
