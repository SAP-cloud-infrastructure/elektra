import apiClient from "./apiClient"

export const fetchHealthmonitor = (lbID, poolID, healthmonitorID, options) => {
  return new Promise((handleSuccess, handleError) => {
    apiClient
      .get(`/loadbalancers/${lbID}/pools/${poolID}/healthmonitors/${healthmonitorID}`, { params: options })
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleError(error)
      })
  })
}

export const postHealthMonitor = (lbID, poolID, values) => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .post(`/loadbalancers/${lbID}/pools/${poolID}/healthmonitors`, {
        healthmonitor: values,
      })
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}

export const putHealthmonitor = (lbID, poolID, healthmonitorID, values) => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .put(`/loadbalancers/${lbID}/pools/${poolID}/healthmonitors/${healthmonitorID}`, { healthmonitor: values })
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}

export const deleteHealthmonitor = (lbID, poolID, healthmonitorID) => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .delete(`/loadbalancers/${lbID}/pools/${poolID}/healthmonitors/${healthmonitorID}`)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}
