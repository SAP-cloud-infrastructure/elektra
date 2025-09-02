import apiClient from "./apiClient"

export const fetchListeners = (lbID, options) => {
  return new Promise((handleSuccess, handleError) => {
    apiClient
      .get(`/loadbalancers/${lbID}/listeners`, { params: options })
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleError(error)
      })
  })
}

export const fetchListener = (lbID, id) => {
  return new Promise((handleSuccess, handleError) => {
    apiClient
      .get(`/loadbalancers/${lbID}/listeners/${id}`)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleError(error)
      })
  })
}

export const postListener = (lbID, values) => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .post(`/loadbalancers/${lbID}/listeners`, { listener: values })
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}

export const putListener = (lbID, listenerID, values) => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .put(`/loadbalancers/${lbID}/listeners/${listenerID}`, {
        listener: values,
      })
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}

export const deleteListener = (lbID, listenerID) => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .delete(`/loadbalancers/${lbID}/listeners/${listenerID}`)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}

export const fetchListnersNoDefaultPoolForSelect = (lbID) => {
  return new Promise((handleSuccess, handleError) => {
    apiClient
      .get(`/loadbalancers/${lbID}/listeners/items_no_def_pool_for_select`)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleError(error)
      })
  })
}

export const fetchListnersForSelect = (lbID) => {
  return new Promise((handleSuccess, handleError) => {
    apiClient
      .get(`/loadbalancers/${lbID}/listeners/items_for_select`)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleError(error)
      })
  })
}

export const fetchSecretsForSelect = async (options = {}) => {
  // collect secrets by type
  const [certResponse, opaqueResponse] = await Promise.all([
    apiClient.osApi("key-manager").get("/v1/secrets", {
      params: {
        ...options,
        sort: "created:desc",
        secret_type: "CERTIFICATE",
        limit: 50,
      },
    }),
    apiClient.osApi("key-manager").get("/v1/secrets", {
      params: {
        ...options,
        sort: "created:desc",
        secret_type: "OPAQUE",
        limit: 50,
      },
    }),
  ])

  const certData = certResponse?.data ?? {}
  const opaqueData = opaqueResponse?.data ?? {}

  // Merge totals
  const total = (certData.total || 0) + (opaqueData.total || 0)

  // Merge items
  const allSecrets = [...(certData?.secrets || []), ...(opaqueData?.secrets || [])]

  // Transform into select options
  const selectSecrets = allSecrets.map((c) => ({
    label: `${c.name} (${c.secret_ref})`,
    value: c.secret_ref,
  }))

  return { secrets: selectSecrets, total }
}

export const fetchCiphers = () => {
  return new Promise((handleSuccess, handleErrors) => {
    apiClient
      .get(`/loadbalancers/ciphers`)
      .then((response) => {
        handleSuccess(response.data)
      })
      .catch((error) => {
        handleErrors(error)
      })
  })
}
