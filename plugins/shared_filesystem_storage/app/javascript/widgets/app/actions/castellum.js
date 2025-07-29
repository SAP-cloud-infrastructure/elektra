import * as constants from "../constants"
import { searchShareIDs } from "./shares"
import { createAjaxHelper } from "lib/ajax_helper"
import { confirm } from "lib/dialogs"
import { addError } from "lib/flashes"

let ajaxHelper = null

export const configureCastellumAjaxHelper = (opts) => {
  ajaxHelper = createAjaxHelper(opts)
}

const castellumErrorMessage = (error) => error.data || error.message

const fetchCastellumData =
  (projectID, path, jsonKey = null) =>
  (dispatch, getState) => {
    dispatch({
      type: constants.REQUEST_CASTELLUM_DATA,
      key: jsonKey,
      requestedAt: Date.now(),
    })

    const endpoint = path || `/v1/projects/${projectID}`
    return ajaxHelper
      .get(endpoint)
      .then((response) => {
        const responseData = jsonKey ? response.data[jsonKey] : response.data
        const { data, allShares } = filterShareTypeData(responseData)
        console.log("DATA", data, jsonKey, allShares)
        if (Array.isArray(data)) {
          const shareIDs = data.map((elem) => elem.asset_id).filter((elem) => (elem ? true : false))
          if (shareIDs.length > 0) {
            dispatch(searchShareIDs(shareIDs))
          }
        }
        dispatch({
          type: constants.RECEIVE_CASTELLUM_DATA,
          key: jsonKey,
          data: data,
          allShares,
          receivedAt: Date.now(),
        })
      })
      .catch((error) => {
        //for the resource config, a 404 response is not an error; it just shows
        //that autoscaling is disabled on this project resource
        if (jsonKey == "resources" && error.status === 404) {
          dispatch({
            type: constants.RECEIVE_CASTELLUM_DATA,
            key: jsonKey,
            data: null,
            receivedAt: Date.now(),
          })
        } else {
          let msg = error.message
          if (error.data) {
            msg = `${msg}: ${error.data}`
          }
          dispatch({
            type: constants.REQUEST_CASTELLUM_DATA_FAILURE,
            jsonKey,
            message: msg,
            receivedAt: Date.now(),
          })
        }
      })
  }

function filterShareTypeData(data = {}) {
  const matchingData = {}
  let allShares = false
  Object.keys(data).forEach((key) => {
    if (key === "nfs-shares") {
      allShares = true
      matchingData[key] = data[key]
    } else if (key.startsWith("nfs-shares-type")) {
      allShares = false
      matchingData[key] = data[key]
    }
  })
  return { data: matchingData, allShares }
}

export const fetchCastellumDataIfNeeded =
  (projectID, path, jsonKey = null) =>
  (dispatch, getState) => {
    const castellumState = getState().castellum || {}
    const { isFetching, requestedAt } = castellumState[jsonKey] || {}
    if (!isFetching && !requestedAt) {
      return dispatch(fetchCastellumData(projectID, path, jsonKey))
    }
  }

export const configureAutoscaling = (projectID, shareType, config) => (dispatch, getState) => {
  return new Promise((resolve, reject) =>
    ajaxHelper
      .put(`/v1/projects/${projectID}/resources/${shareType}`, config)
      .catch((error) => {
        reject(castellumErrorMessage(error))
      })
      .then((response) => {
        if (response) {
          dispatch(fetchCastellumData(projectID, null, "resources"))
          resolve()
        }
      })
  )
}

export const disableAutoscaling = (projectID, shareType) => (dispatch, getState) => {
  confirm("Do you really want to disable autoscaling on this project?").then(() =>
    ajaxHelper
      .delete(`/v1/projects/${projectID}/resources/${shareType}`)
      .catch((error) => addError(castellumErrorMessage(error)))
      .then((response) => {
        if (response) {
          dispatch(fetchCastellumData(projectID, null, "resources"))
        }
      })
  )
}
