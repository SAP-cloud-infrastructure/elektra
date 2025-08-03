import { connect } from "react-redux"
import { configureAutoscaling } from "../../../actions/castellum"
import CastellumConfigurationEditModal from "../../../components/castellum/configuration/edit"
import { CASTELLUM_AUTOSCALING } from "../../../constants"

export default connect(
  (state) => ({
    config: (state.castellum || {})[CASTELLUM_AUTOSCALING.key],
  }),
  (dispatch) => ({
    configureAutoscaling: (projectID, shareType, cfg) => dispatch(configureAutoscaling(projectID, shareType, cfg)),
  })
)(CastellumConfigurationEditModal)
