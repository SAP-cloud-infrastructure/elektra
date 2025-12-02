import * as constants from "../constants"
import { pluginAjaxHelper } from "lib/ajax_helper"
import { confirm } from "lib/dialogs"
import { addNotice, addError } from "lib/flashes"
import { ErrorsList } from "lib/elektra-form/components/errors_list"
import React from "react"

import imageActions from "./os_images"

const ajaxHelper = pluginAjaxHelper("image")

//################### IMAGES #########################
const requestImageMembers = (imageId) => ({
  type: constants.REQUEST_IMAGE_MEMBERS,
  imageId,
  requestedAt: Date.now(),
})

const requestImageMembersFailure = (imageId) => ({
  type: constants.REQUEST_IMAGE_MEMBERS_FAILURE,
  imageId,
})

const receiveImageMembers = (imageId, json) => ({
  type: constants.RECEIVE_IMAGE_MEMBERS,
  items: json,
  imageId,
  receivedAt: Date.now(),
})
const receiveImageMember = (imageId, member) => ({
  type: constants.RECEIVE_IMAGE_MEMBER,
  imageId,
  member,
})
const fetchImageMembers = (imageId) =>
  function (dispatch) {
    dispatch(requestImageMembers(imageId))
    return new Promise((handleSuccess, handleErrors) => {
      ajaxHelper
        .get(`/ng/images/${imageId}/members`)
        .then((response) => {
          if (response.data.errors) {
            dispatch(requestImageMembersFailure(imageId))
            handleErrors(response.data.errors)
            // addError(React.createElement(ErrorsList, {errors: response.data.errors}))
          } else {
            dispatch(receiveImageMembers(imageId, response.data.members))
          }
        })
        .catch((error) => {
          dispatch(requestImageMembersFailure(imageId))
          handleErrors(error.message)
          // addError(`Could not load image members (${error.message})`)
        })
    })
  }
const resetImageMembers = (imageId) => {
  return {
    type: constants.RESET_IMAGE_MEMBERS,
    imageId,
  }
}

const shouldFetchImageMembers = (imageId, state) => {
  const members = state.imageMembers[imageId] || {}

  if (members.isFetching || members.requestedAt) {
    return false
  } else {
    return true
  }
}

const fetchImageMembersIfNeeded = (imageId) =>
  function (dispatch, getState) {
    if (shouldFetchImageMembers(imageId, getState())) {
      return dispatch(fetchImageMembers(imageId))
    }
  }
const requestDeleteMember = (imageId, memberId) => ({
  type: constants.REQUEST_DELETE_IMAGE_MEMBER,
  imageId,
  memberId,
})
const deleteImageMemberFailure = (imageId, memberId) => ({
  type: constants.DELETE_IMAGE_MEMBER_FAILURE,
  imageId,
  memberId,
})
const removeImageMember = (imageId, memberId) => ({
  type: constants.DELETE_IMAGE_MEMBER,
  imageId,
  memberId,
})
const deleteImageMember = (imageId, memberId) =>
  function (dispatch) {
    dispatch(requestDeleteMember(imageId, memberId))
    ajaxHelper
      .delete(`/ng/images/${imageId}/members/${memberId}`)
      .then((response) => {
        if (response.data && response.data.errors) {
          addError(React.createElement(ErrorsList, { errors: response.data.errors }))
          dispatch(deleteImageMemberFailure(imageId, memberId))
        } else {
          dispatch(removeImageMember(imageId, memberId))
        }
      })
      .catch((error) => {
        dispatch(deleteImageMemberFailure(memberId))
        addError(React.createElement(ErrorsList, { errors: error.message }))
      })
  }
//################ IMAGE FORM ###################
const submitNewImageMember = (imageId, memberId) => (dispatch) =>
  new Promise((handleSuccess, handleErrors) =>
    ajaxHelper
      .post(`/ng/images/${imageId}/members`, { member_id: memberId })
      .then((response) => {
        if (response.data.errors) handleErrors({ errors: response.data.errors })
        else {
          dispatch(receiveImageMember(imageId, response.data))
          handleSuccess()
        }
      })
      .catch((error) => handleErrors({ errors: error.message }))
  )

const acceptSuggestedImage = (imageId) => (dispatch, getState) => {
  dispatch(imageActions("suggested").requestOsImage(imageId))
  return ajaxHelper.put(`/ng/images/${imageId}/members/accept`, { image_id: imageId }).then((response) => {
    if (response.data.errors) addError(React.createElement(ErrorsList, { errors: response.data.errors }))
    else {
      if (getState().available.requestedAt) dispatch(imageActions("available").receiveOsImage(response.data))

      dispatch(imageActions("suggested").removeOsImage(imageId))
    }
  })
}

const rejectSuggestedImage = (imageId) => (dispatch) => {
  dispatch(imageActions("suggested").requestOsImage(imageId))
  return ajaxHelper.put(`/ng/images/${imageId}/members/reject`, { image_id: imageId }).then((response) => {
    if (response.data.errors) addError(React.createElement(ErrorsList, { errors: response.data.errors }))
    else {
      dispatch(imageActions("suggested").removeOsImage(imageId))
    }
  })
}

export {
  fetchImageMembers,
  resetImageMembers,
  fetchImageMembersIfNeeded,
  deleteImageMember,
  submitNewImageMember,
  acceptSuggestedImage,
  rejectSuggestedImage,
}
