import { connect } from "react-redux"
import CastellumScrapingErrors from "../../components/castellum/scraping_errors"
import { fetchCastellumDataIfNeeded, fetchAssetsIfNeeded } from "../../actions/castellum"
import { deleteShare, forceDeleteShare } from "../../actions/shares"
import { CASTELLUM_AUTOSCALING } from "../../constants"
import { CASTELLUM_ASSET_SCRAPE } from "../../constants"

export default connect(
  (state) => ({
    config: (state.castellum || {})[CASTELLUM_AUTOSCALING.key],
    assets: (state.castellum || {})[CASTELLUM_ASSET_SCRAPE.key],
    shares: (state.shares || {}).items,
  }),
  (dispatch) => ({
    loadShareTypesOnce: (projectID) => dispatch(fetchCastellumDataIfNeeded(projectID, null, CASTELLUM_AUTOSCALING.key)),
    loadAssetsOnce: (projectID, shareTypes) => dispatch(fetchAssetsIfNeeded(projectID, shareTypes)),
    handleDelete: (shareID) => dispatch(deleteShare(shareID)),
    handleForceDelete: (shareID) => dispatch(forceDeleteShare(shareID)),
  })
)(CastellumScrapingErrors)
