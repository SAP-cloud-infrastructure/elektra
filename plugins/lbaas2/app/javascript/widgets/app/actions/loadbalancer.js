import apiClient from "./apiClient"

export const fetchAvailabilityZones = () => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .get(`/loadbalancers/availability-zones`)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}

export const fetchLoadbalancers = (options) => {
  return new Promise((handleSuccess, handleError) => {
    apiClient
      .get(`/loadbalancers`, { params: options })
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleError(error)
      })
  })
}

export const fetchLoadbalancer = (id) => {
  return new Promise((handleSuccess, handleError) => {
    apiClient
      .get(`/loadbalancers/${id}`)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleError(error)
      })
  })
}

export const postLoadbalancer = (values) => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .post("/loadbalancers/", { loadbalancer: values })
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}

export const putLoadbalancer = (lbID, values) => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .put(`/loadbalancers/${lbID}`, { loadbalancer: values })
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}

export const deleteLoadbalancer = (id) => {
  return new Promise((handleSuccess, handleErrors) => {
    return apiClient
      .delete(`/loadbalancers/${id}`)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}

export const fetchPrivateNetworks = () => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .get(`/loadbalancers/private-networks`)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}

export const fetchSubnets = (id) => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .get(`/loadbalancers/private-networks/${id}/subnets`)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}

export const fetchFloatingIPs = () => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .get(`/loadbalancers/fips`)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}

export const fetchLoadbalancerDevice = (id) => {
  return new Promise((handleSuccess, handleError) => {
    apiClient
      .get(`/loadbalancers/${id}/device`)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleError(error)
      })
  })
}

export const putAttachFIP = (lbID, values) => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .put(`/loadbalancers/${lbID}/attach_fip`, values)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}

export const putDetachFIP = (lbID, values) => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .put(`/loadbalancers/${lbID}/detach_fip`, values)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}
