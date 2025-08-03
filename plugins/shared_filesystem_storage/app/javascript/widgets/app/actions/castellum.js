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
  (projectID, path, jsonKey = null, isAllShares = true) =>
  (dispatch, getState) => {
    dispatch({
      type: constants.REQUEST_CASTELLUM_DATA,
      key: jsonKey,
      requestedAt: Date.now(),
    })

    const endpointPrefix = "/v1"
    const defaultEndpoint = constants.CASTELLUM_AUTOSCALING.endpoint.concat(projectID)
    const endpoint = path ? endpointPrefix.concat(path) : endpointPrefix.concat(defaultEndpoint)
    return ajaxHelper
      .get(endpoint)
      .then((response) => {
        let data = jsonKey ? response.data[jsonKey] : response.data
        let allShares = isAllShares
        if (Array.isArray(data)) {
          const { data: filteredData, allShares: scope } = filterOperations(data)
          data = filteredData
          allShares = scope
          const shareIDs = data.map((elem) => elem.asset_id).filter((elem) => (elem ? true : false))
          if (shareIDs.length > 0) {
            dispatch(searchShareIDs(shareIDs))
          }
        } else {
          const { data: filteredData, allShares: scope } = filterShareTypeData(data, isAllShares)
          data = filteredData
          allShares = scope
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
        if (jsonKey == constants.CASTELLUM_AUTOSCALING.key && error.status === 404) {
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

function filterShareTypeData(data = {}, isAllShares) {
  let matchingData = {}
  let allShares = isAllShares

  const combinedConfigKey = Object.keys(data).filter((key) => key == constants.CASTELLUM_SCOPES.combined)
  if (combinedConfigKey.length == 1) {
    allShares = true
    matchingData = data
    return { data: matchingData, allShares }
  }

  const separateConfigKeys = Object.keys(data).filter((key) => key.startsWith(constants.CASTELLUM_SCOPES.separate))
  if (separateConfigKeys.length > 0) {
    allShares = false
    separateConfigKeys.forEach((key) => {
      matchingData[key] = data[key]
    })
    return { data: matchingData, allShares }
  }

  return { data: { [constants.CASTELLUM_SCOPES.combined]: null }, allShares }
}

function filterOperations(data = []) {
  let matchingData = []
  let allShares = true
  const key = "asset_type"

  const combinedResult = data.filter((entry) => entry[key] == constants.CASTELLUM_SCOPES.combined)
  if (combinedResult.length > 0) {
    allShares = true
    matchingData = combinedResult
    return { data: matchingData, allShares }
  }

  const separateResult = data.filter((entry) => entry[key].startsWith(constants.CASTELLUM_SCOPES.separate))
  if (separateResult.length > 0) {
    allShares = false
    matchingData = separateResult
    return { data: matchingData, allShares }
  }

  return { data: [], allShares }
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
          dispatch(fetchCastellumData(projectID, null, constants.CASTELLUM_AUTOSCALING.key))
          resolve()
        }
      })
  )
}

export const disableAutoscaling = (projectID, shareTypes, allShares) => (dispatch, getState) => {
  confirm("Do you really want to disable the autoscaling configuration on this project?").then(async () => {
    const deletePromises = shareTypes.map((shareType) =>
      ajaxHelper
        .delete(`/v1/projects/${projectID}/resources/${shareType}`)
        .catch((error) => addError(castellumErrorMessage(error)))
    )

    try {
      await Promise.all(deletePromises)
      dispatch(fetchCastellumData(projectID, null, constants.CASTELLUM_AUTOSCALING.key, allShares))
    } catch (error) {
      addError(castellumErrorMessage(error))
    }
  })
}

export const fetchAssets =
  (projectID, shareTypes = []) =>
  async (dispatch, getState) => {
    const path = constants.CASTELLUM_ASSET_SCRAPE.endpoint
    const assetPromises = shareTypes.map((shareType) => {
      const endpoint = path.replace(":id", projectID).concat(shareType)
      return ajaxHelper.get(`/v1/${endpoint}`).catch((error) => addError(castellumErrorMessage(error)))
    })

    try {
      const results = await Promise.all(assetPromises)
      const data = results.map((result) => result.data[constants.CASTELLUM_ASSET_SCRAPE.key])
      dispatch({
        type: constants.RECEIVE_CASTELLUM_DATA,
        key: constants.CASTELLUM_ASSET_SCRAPE.key,
        data,
        receivedAt: Date.now(),
      })
    } catch (error) {
      let msg = error.message
      if (error.data) {
        msg = `${msg}: ${error.data}`
      }
      dispatch({
        type: constants.REQUEST_CASTELLUM_DATA_FAILURE,
        key: constants.CASTELLUM_ASSET_SCRAPE.key,
        message: msg,
        receivedAt: Date.now(),
      })
    }
  }

export const fetchAssetsIfNeeded =
  (projectID, shareTypes = []) =>
  (dispatch, getState) => {
    const castellumState = getState().castellum || {}
    const { isFetching, requestedAt } = castellumState[constants.CASTELLUM_ASSET_SCRAPE.key] || {}
    if (!isFetching && !requestedAt) {
      return dispatch(fetchAssets(projectID, shareTypes))
    }
  }
