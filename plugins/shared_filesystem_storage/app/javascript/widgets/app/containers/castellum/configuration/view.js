import { connect } from "react-redux"
import CastellumConfigurationView from "../../../components/castellum/configuration/view"
import { disableAutoscaling } from "../../../actions/castellum"
import { fetchShareTypesIfNeeded } from "../../../actions/share_types"
import { CASTELLUM_AUTOSCALING } from "../../../constants"

export default connect(
  (state) => ({
    config: (state.castellum || {})[CASTELLUM_AUTOSCALING.key],
    shareTypes: state.shareTypes,
  }),
  (dispatch) => ({
    disableAutoscaling: (projectID, shareTypes, allShares) =>
      dispatch(disableAutoscaling(projectID, shareTypes, allShares)),
    loadShareTypesOnce: () => dispatch(fetchShareTypesIfNeeded()),
  })
)(CastellumConfigurationView)
