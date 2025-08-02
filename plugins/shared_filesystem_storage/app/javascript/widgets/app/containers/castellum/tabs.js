import { connect } from "react-redux"
import CastellumTabs from "../../components/castellum/tabs"
import { fetchCastellumDataIfNeeded } from "../../actions/castellum"

export default connect(
  (state) => ({
    config: (state.castellum || {})["resources"],
  }),
  (dispatch) => ({
    loadResourceConfigOnce: (projectID) =>
      dispatch(fetchCastellumDataIfNeeded(projectID, null, "resources")),
  })
)(CastellumTabs)
