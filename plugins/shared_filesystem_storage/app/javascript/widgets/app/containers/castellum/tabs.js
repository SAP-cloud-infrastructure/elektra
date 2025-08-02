import { connect } from "react-redux"
import CastellumTabs from "../../components/castellum/tabs"
import { fetchCastellumDataIfNeeded } from "../../actions/castellum"
import { CASTELLUM_AUTOSCALING } from "../../constants"

export default connect(
  (state) => ({
    config: (state.castellum || {})[CASTELLUM_AUTOSCALING.key],
  }),
  (dispatch) => ({
    loadResourceConfigOnce: (projectID) =>
      dispatch(fetchCastellumDataIfNeeded(projectID, null, CASTELLUM_AUTOSCALING.key)),
  })
)(CastellumTabs)
