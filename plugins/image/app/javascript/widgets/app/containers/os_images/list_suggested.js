import { connect } from "react-redux"
import OsImageList from "../../components/os_images/list"

import imageActions from "../../actions/os_images"
const actions = imageActions("suggested")
import {
  acceptSuggestedImage,
  rejectSuggestedImage,
} from "../../actions/image_members"

export default connect(
  (state) => ({
    activeTab: "suggested",
    visibilityCounts: state.suggested.visibilityCounts,
    activeVisibilityFilter: state.suggested.activeVisibilityFilter,
    items: state.suggested.items,
    isFetching: state.suggested.isFetching,
    hasNext: state.suggested.hasNext[state.suggested.activeVisibilityFilter],
    searchTerm: state.suggested.searchTerm,
  }),

  (dispatch) => ({
    handleAccept: (imageId) => dispatch(acceptSuggestedImage(imageId)),
    handleReject: (imageId) => dispatch(rejectSuggestedImage(imageId)),
    loadOsImagesOnce: () => dispatch(actions.fetchOsImagesIfNeeded()),
    loadNext: () => dispatch(actions.loadNext()),
    setActiveVisibilityFilter: (visibility) =>
      dispatch(actions.setActiveVisibilityFilter(visibility)),
    searchOsImages: (term) => dispatch(actions.searchOsImages(term)),
    reloadOsImage: (osImageId) => dispatch(actions.reloadOsImage(osImageId)),
    handleDelete: (osImageId) => dispatch(actions.deleteOsImage(osImageId)),
  })
)(OsImageList)
