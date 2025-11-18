import { connect } from "react-redux"
import ImageMembersModal from "../../components/os_images/image_members"
import {
  fetchImageMembersIfNeeded,
  fetchImageMembers,
  resetImageMembers,
  submitNewImageMember,
  deleteImageMember,
  rejectSuggestedImage,
} from "../../actions/image_members"

import imageActions from "../../actions/os_images"
const actions = imageActions("available")

export default connect(
  (state, ownProps) => {
    let image
    let activeTab
    let imageMembers

    const match = ownProps.match

    if (match && match.params && match.params.activeTab && match.params.id) {
      activeTab = match.params.activeTab
      let images = state[match.params.activeTab].items
      if (images) image = images.find((item) => item.id == match.params.id)
    }

    if (image && state.imageMembers && state.imageMembers[image.id]) {
      imageMembers = state.imageMembers[image.id]
    }
    return { image, activeTab, imageMembers }
  },
  (dispatch) => ({
    handleVisibilityChange: (imageId, visibility) => dispatch(actions.updateImageVisibility(imageId, visibility)),
    loadMembersOnce: (imageId) => dispatch(fetchImageMembersIfNeeded(imageId)),
    reloadMembers: (imageId) => dispatch(fetchImageMembers(imageId)),
    resetImageMembers: (imageId) => dispatch(resetImageMembers(imageId)),
    handleSubmit: (imageId, memberId) => dispatch(submitNewImageMember(imageId, memberId)),
    handleDelete: (imageId, memberId) => dispatch(deleteImageMember(imageId, memberId)),
    handleReject: (imageId) => dispatch(rejectSuggestedImage(imageId)),
  })
)(ImageMembersModal)
