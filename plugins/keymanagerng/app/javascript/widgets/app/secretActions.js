import apiClient from "./apiClient"

export const getSecrets = ({ queryKey }) => {
  const [_key, paginationOptions] = queryKey
  return fetchSecrets(paginationOptions)
}

export const fetchSecrets = (options) => {
  return apiClient
    .osApi("key-manager")
    .get("/v1/secrets", {
      params: {
        ...options,
        sort: "created:desc",
      },
    })
    .then((response) => {
      return response?.data
    })
}

export const getSecret = ({ queryKey }) => {
  const [_key, uuid] = queryKey
  return fetchSecret(uuid)
}

export const fetchSecret = (uuid) => {
  return apiClient
    .osApi("key-manager")
    .get("/v1/secrets/" + uuid)
    .then((response) => {
      return response?.data
    })
}

export const getSecretMetadata = ({ queryKey }) => {
  const [_key, uuid] = queryKey
  return fetchSecretMetadata(uuid)
}

export const fetchSecretMetadata = (uuid) => {
  return apiClient
    .osApi("key-manager")
    .get("/v1/secrets/" + uuid + "/metadata")
    .then((response) => {
      return response?.data
    })
}
export const getSecretPayload = ({ queryKey }) => {
  const [_key, uuid, headerAttr] = queryKey
  return fetchSecretPayload(uuid, headerAttr)
}

export const fetchSecretPayload = (uuid, headerAttr) => {
  return apiClient
    .osApi("key-manager")
    .get("/v1/secrets/" + uuid + "/payload", {
      headers: { Accept: headerAttr },
    })
    .then((response) => {
      return response?.data
    })
}

export const delSecret = ({ queryKey }) => {
  const [_key, uuid] = queryKey
  return deleteSecret(uuid)
}

export const deleteSecret = (delObj) => {
  return apiClient
    .osApi("key-manager")
    .delete(`v1/secrets/${delObj.id}`)
    .then((response) => {
      return response?.data
    })
}

export const addSecret = ({ queryKey }) => {
  const [_key, formData] = queryKey
  return createSecret(formData)
}

export const createSecret = (formData) => {
  return apiClient
    .osApi("key-manager")
    .post("v1/secrets", formData)
    .then((response) => {
      return response?.data
    })
}
