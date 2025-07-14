import React from "react"
import { useDispatch, useGlobalState } from "../StateProvider"
import { apiClient } from "../lib/apiClient"
import { serviceName } from "../lib/apiClient"

const decode = (str) => {
  try {
    return decodeURIComponent(str)
  } catch (e) {
    return str
  }
}

const encode = (str) => encodeURIComponent(str)

const containerPath = (containerName) => encode(decode(containerName))

const objectPath = (containerName, object) => encode(decode(containerName)) + "/" + encode(decode(object))

export const stripHtml = (html) => {
  // html is <html><h1>TITLE</h1><p>TEXT</p></html>
  const errorData = html.match(/<html><h1>(.*)<\/h1><p>(.*)<\/p><\/html>/)

  if (errorData && errorData.length > 2) return `${errorData[1]}: ${errorData[2]}`

  let tmp = document.createElement("DIV")
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ""
}

const useActions = () => {
  const { capabilities, containers, objects, account } = useGlobalState()
  const dispatch = useDispatch()

  const loadCapabilitiesOnce = React.useCallback(
    (options = {}) => {
      if ((capabilities.updatedAt || capabilities.error) && !options.reload) return

      dispatch({ type: "REQUEST_CAPABILITIES" })
      apiClient
        .osApi(serviceName)
        .get("info", {
          params: { path_prefix: serviceName === "swift" ? "/" : "/swift" },
        })
        .then((response) => {
          dispatch({ type: "RECEIVE_CAPABILITIES", data: response.data })
        })
        .catch((error) =>
          dispatch({
            type: "RECEIVE_CAPABILITIES_ERROR",
            error: stripHtml(error.message),
          })
        )
    },
    [dispatch, capabilities.updatedAt]
  )

  const loadAccountMetadataOnce = React.useCallback(
    (options = {}) => {
      if ((account.updatedAt || account.error) && !options.reload) return account.data

      dispatch({ type: "REQUEST_ACCOUNT_METADATA" })
      return apiClient
        .osApi(serviceName)
        .head("")
        .then((response) => {
          dispatch({ type: "RECEIVE_ACCOUNT_METADATA", data: response.headers })
          return response.headers
        })
        .catch((error) =>
          dispatch({
            type: "RECEIVE_ACCOUNT_METADATA_ERROR",
            error: stripHtml(error.message),
          })
        )
    },
    [dispatch, account]
  )

  const loadContainersOnce = React.useCallback(
    async (options = {}) => {
      if (containers.updatedAt && !options.reload) return Promise.resolve()

      dispatch({ type: "REQUEST_CONTAINERS" })

      let data = []
      let marker = ""
      let hasMore = true

      do {
        await apiClient
          .osApi(serviceName)
          .get("", { params: { marker } })
          .then((response) => {
            data = [...data, ...response.data]
            if (response.data.length > 0) {
              marker = response.data[response.data.length - 1].name
              hasMore = response.data.length > 9999
            } else {
              hasMore = false
            }
          })
          .catch((error) =>
            dispatch({
              type: "RECEIVE_CONTAINERS_ERROR",
              error: stripHtml(error.message),
            })
          )
      } while (hasMore)

      dispatch({
        type: "RECEIVE_CONTAINERS",
        items: data,
      })

      return data
    },
    [dispatch, containers.updatedAt]
  )

  const loadContainerObjects = React.useCallback(
    async (containerName, options = {}) => {
      let data = []
      let headers = {}
      let marker = ""
      let hasMore = true

      do {
        await apiClient
          .osApi(serviceName)
          .get(containerPath(containerName), { params: { ...options, marker } })
          .then((response) => {
            data = [...data, ...response.data]
            headers = response.headers
            if (response.data.length > 0) {
              marker = response.data[response.data.length - 1].name
              hasMore = response.data.length > 9999
            } else {
              hasMore = false
            }
          })
      } while (hasMore)

      return { data, headers }
    },
    [dispatch, objects]
  )

  const loadObjectMetadata = React.useCallback(
    (containerName, name) =>
      apiClient
        .osApi(serviceName)
        .head(objectPath(containerName, name))
        .then((response) => response.headers),
    []
  )

  const deleteObject = React.useCallback((containerName, name, params = {}) => {
    // params is an object of query parameters
    // only build query string if params is not empty
    let query =
      Object.keys(params || {}).length > 0 &&
      "?" +
        Object.keys(params)
          .map((key) => `${key}=${params[key]}`)
          .join("&")

    return apiClient
      .osApi(serviceName)
      .delete(objectPath(containerName, name) + (query ? encodeURIComponent(query) : ""))
      .then((response) => response.data)
  }, [])

  // Function to delete one or multiple objects in a container
  const deleteObjects = React.useCallback(
    async (containerName, objects) => {
      const bulkDeleteOptions = capabilities?.data?.bulk_delete
      let promises = []

      // Deleting objects can be done in chunks if the API supports bulk delete options
      if (bulkDeleteOptions && bulkDeleteOptions.max_deletes_per_request) {
        // bulk delete!
        // in swift backend it is currently limited to 10000 objects per request
        const chunkSize = bulkDeleteOptions.max_deletes_per_request

        for (let i = 0; i < objects.length; i += chunkSize) {
          const chunk = objects.slice(i, i + chunkSize)
          const body = chunk.map((o) => objectPath(containerName, o.name)).join("\n")
          // collect all delete promises
          promises.push(() =>
            // Wrapped in arrow function to create promise factory
            apiClient
              .osApi(serviceName)
              .post("", body, {
                params: { "bulk-delete": true, "X-Original-Object-Count": objects.length },
                headers: { "Content-Type": "text/plain" },
              })
              .then((response) => {
                const data = response.data || {}
                const status = data["Response Status"] || ""
                if (status.indexOf("200") < 0) throw new Error(data["Response Body"])
                else return data
              })
          )
        }
      } else {
        // Delete each object individually
        // collect delete promises
        promises = objects.map((object) => () => deleteObject(containerName, object.name)) // MODIFIED: Wrapped in arrow function
      }

      // Execute promises in batches of 50 to avoid overwhelming the server
      // every promise function will be executed in parallel, but in batches of maxConcurrentRequests

      // for example,
      // if 1000000 objects to delete max_deletes_per_request is 10000,
      // then it will create 100 promise functions,
      // and execute them in 2 batches of 50 requests at once
      // 2 x 50 x 10000 = 1000000 objects

      // This is to prevent overwhelming the server with too many requests at once
      const maxConcurrentRequests = 50
      const results = []
      console.log(`Deleting ${objects.length} objects in batches of ${maxConcurrentRequests}`)

      // Iterate over the promises array in chunks of maxConcurrentRequests
      for (let i = 0; i < promises.length; i += maxConcurrentRequests) {
        console.log(`Processing batch ${Math.floor(i / maxConcurrentRequests) + 1}`)
        // Slice the promises array to get the a batch of 50 promises
        // Each promise function in the batch will be executed in parallel
        // This allows us to control the number of concurrent requests
        const batch = promises.slice(i, i + maxConcurrentRequests)
        // Execute the promise functions in this batch
        const batchPromises = batch.map((promiseFunc) => promiseFunc())
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
      }
      console.log(`Deleted ${results.length} objects successfully.`)
      return results
    },
    [capabilities, deleteObject]
  )

  const getVersions = React.useCallback((containerName) =>
    apiClient
      .osApi(serviceName)
      .get(containerName, { params: { versions: true } })
      .then((result) => result?.data)
  )

  const deleteVersion = React.useCallback((containerName, { name, version_id }) =>
    apiClient.osApi(serviceName).delete(objectPath(containerName, name), {
      params: { "version-id": version_id },
    })
  )

  const deleteContainer = React.useCallback(
    (containerName) => {
      return apiClient
        .osApi(serviceName)
        .delete(containerPath(containerName))
        .then(() => {
          dispatch({ type: "REMOVE_CONTAINER", name: containerName })
        })
    },
    [dispatch]
  )

  const createContainer = React.useCallback(
    (containerName) =>
      apiClient
        .osApi(serviceName)
        .put(containerPath(containerName), {}, { headers: { "Content-Length": "0" } })
        .then(() => {
          dispatch({
            type: "RECEIVE_CONTAINER",
            item: {
              name: containerName,
              count: 0,
              bytes: 0,
              last_modified: new Date().toISOString(),
            },
          })
        }),
    [dispatch]
  )

  const createFolder = React.useCallback((containerName, path, name) => {
    let fullPath = path ? path : ""
    if (fullPath.length > 0 && fullPath[fullPath.length - 1] !== "/") fullPath += "/"
    fullPath += name + "/"
    const contentType = "application/directory"

    return apiClient
      .osApi(serviceName)
      .put(objectPath(containerName, fullPath), null, {
        headers: { "Content-Type": contentType },
      })
      .then(() => ({
        subdir: fullPath,
      }))
  }, [])

  const loadContainerMetadata = React.useCallback(
    (containerName) => {
      return apiClient
        .osApi(serviceName)
        .head(containerPath(containerName))
        .then((response) => {
          const metadata = response.headers
          Object.keys(metadata).forEach((k) => (metadata[k] = decodeURIComponent(metadata[k])))
          const date = new Date(metadata["x-last-modified"])
          dispatch({
            type: "RECEIVE_CONTAINER",
            item: {
              name: containerName,
              bytes: metadata["x-container-bytes-used"],
              count: metadata["x-container-object-count"],
              last_modified: date || metadata["x-last-modified"],
              metadata,
            },
          })
          return metadata
        })
    },
    [dispatch]
  )
  const updateContainerMetadata = React.useCallback((containerName, headers) => {
    const newHeaders = { ...headers }
    Object.keys(newHeaders).forEach(
      (k) => k && k.indexOf("x-container-meta") === 0 && (newHeaders[k] = encodeURIComponent(newHeaders[k]))
    )

    return apiClient.osApi(serviceName).post(containerPath(containerName), {}, { headers: newHeaders })
  }, [])

  const updateObjectMetadata = React.useCallback(
    (containerName, name, headers) =>
      apiClient.osApi(serviceName).post(objectPath(containerName, name), {}, { headers: headers }),
    []
  )

  const copyObject = React.useCallback((containerName, name, target = {}, options = {}) => {
    let copyMetadata = options.withMetadata !== false

    return apiClient.osApi(serviceName).copy(objectPath(containerName, name), {
      headers: {
        destination: objectPath(`/${target.container}`, target.path),
        "x-fresh-metadata": copyMetadata ? undefined : true,
      },
    })
  }, [])

  const getAcls = React.useCallback(({ read, write }) => {
    return apiClient.get(`check-acls`, { params: { read, write } }).then((result) => result.data)
  }, [])
  const endpointURL = React.useCallback(
    (containerName, name, params = {}) => {
      return apiClient.osApi(serviceName).url(objectPath(containerName, name), { params })
    },
    [apiClient]
  )

  const rawObjectUrl = React.useCallback(
    (containerName, name, params = {}) => endpointURL(containerName, name, params),
    [endpointURL]
  )

  const downloadObject = React.useCallback(
    (containerName, name, options = {}) => {
      return fetch(endpointURL(containerName, name))
        .then((response) => response.blob())
        .then((blob) => {
          const downloadUrl = URL.createObjectURL(blob)
          const anchor = document.createElement("a")
          anchor.href = downloadUrl
          anchor.download = options.fileName || name

          // Append to the DOM
          document.body.appendChild(anchor)

          // Trigger `click` event
          anchor.click()

          // Remove element from DOM
          document.body.removeChild(anchor)
          URL.revokeObjectURL(downloadUrl)
        })
    },
    [endpointURL, apiClient]
  )

  const uploadObject = React.useCallback(
    (containerName, path, name, file) => {
      if (!path || path === "") path = name
      else {
        if (path[path.length - 1] !== "/") path += "/"
        path += name
      }

      const metaTags = [].slice.call(document.getElementsByTagName("meta"))
      const csrfToken = metaTags.find((tag) => tag.getAttribute("name") == "csrf-token")

      return fetch(endpointURL(containerName, path), {
        method: "PUT",
        headers: {
          "OS-API-Content-Type": "",
          "x-csrf-token": csrfToken.getAttribute("content"),
        },
        body: file,
      }).then(async (response) => {
        console.log(response)
        let data
        try {
          data = await response.json()
        } catch (e) {
          // do nothing
        }

        if (response.status >= 400) throw new Error(data ? data.errors || data.error : response.statusText)
        else return data
      })
    },
    [endpointURL, apiClient]
  )

  const getAuthToken = React.useCallback(() => {
    return apiClient
      .osApi("__auth_token")
      .get("")
      .then((response) => response.data)
  }, [apiClient])

  return {
    endpointURL,
    getAuthToken,
    loadCapabilitiesOnce,
    loadContainersOnce,
    loadAccountMetadataOnce,
    loadObjectMetadata,
    deleteObject,
    deleteObjects,
    copyObject,
    updateObjectMetadata,
    loadContainerMetadata,
    updateContainerMetadata,
    getAcls,
    loadContainerObjects,
    deleteContainer,
    getVersions,
    deleteVersion,
    createContainer,
    createFolder,
    downloadObject,
    uploadObject,
    rawObjectUrl,
  }
}

export default useActions
