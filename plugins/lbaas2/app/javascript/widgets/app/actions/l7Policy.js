import apiClient from "./apiClient"

export const fetchL7Policies = (lbID, listenerID, options) => {
  return new Promise((handleSuccess, handleError) => {
    apiClient
      .get(`/loadbalancers/${lbID}/listeners/${listenerID}/l7policies`, {
        params: options,
      })
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleError(error)
      })
  })
}

export const fetchL7Policy = (lbID, listenerID, l7PolicyID) => {
  return new Promise((handleSuccess, handleError) => {
    apiClient
      .get(`/loadbalancers/${lbID}/listeners/${listenerID}/l7policies/${l7PolicyID}`)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleError(error)
      })
  })
}

export const postL7Policy = (lbID, listenerID, values) => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .post(`/loadbalancers/${lbID}/listeners/${listenerID}/l7policies`, {
        l7policy: values,
      })
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}

export const putL7Policy = (lbID, listenerID, l7policyID, values) => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .put(`/loadbalancers/${lbID}/listeners/${listenerID}/l7policies/${l7policyID}`, { l7policy: values })
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}

export const deleteL7Policy = (lbID, listenerID, l7policyID) => {
  return new Promise((handleSuccess, handleErrors) => {
    return apiClient
      .delete(`/loadbalancers/${lbID}/listeners/${listenerID}/l7policies/${l7policyID}`)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}
