import React from "react"
import { useParams, Link, useRouteMatch, useHistory, Route } from "react-router-dom"
import Breadcrumb from "../shared/Breadcrumb"
import useUrlParamEncoder from "../../hooks/useUrlParamEncoder"
import { Alert } from "react-bootstrap"
import { SearchField } from "lib/components/search_field"
import useActions from "../../hooks/useActions"
import NewObject from "./New"
import UploadFile from "./Upload"
import ShowProperties from "./Show"
import CopyFile from "./Copy"
import DownloadInstructions from "./DownloadInstructions"

import { reducer, initialState } from "./reducer"
import Table from "./Table"
import { LIMIT } from "./config"
import { confirm } from "lib/dialogs"

import { stripHtml } from "../../hooks/useActions"

const Objects = () => {
  let { url } = useRouteMatch()
  let objectsRoot = url.replace(/([^/])\/objects.*/, "$1/objects")
  let history = useHistory()
  let { name: containerName, objectPath } = useParams()
  const { value: currentPath, encode, getFileName } = useUrlParamEncoder(objectPath)
  const [searchTerm, setSearchTerm] = React.useState(null)

  const {
    loadContainerObjects,
    loadObjectMetadata,
    deleteObject,
    deleteObjects,
    loadAccountMetadataOnce,
    downloadObject,
    rawObjectUrl,
  } = useActions()

  const [objects, dispatch] = React.useReducer(reducer, initialState)

  const loadObjects = React.useCallback(() => {
    // Load objects
    // For objects beginning with a slash, this function is called recursively
    // until there are no objects beginning with a slash

    /** Normally, slashes are intended as delimiters for the directories. 
     * However, it is also allowed to create objects with leading slashes in names. 
     * This leads to a problem when we call the API with prefix and delimiter.
     * Example:
     * Given: [
     *  {name: "test/sub_test/image.pmg"},
     *  {name: "/test1/image.png"},
     *  {name: "//test3/sub_test3/a/b.png"}
     * ]
     * API Call: prefix: "", delimiter: "/" => ["test/", "/", "//"]
     * API Call: prefix: "/", delimiter: "/" => ["/test1/", "//"]
     * API Call: prefix: "//", delimiter: "/" => ["//test3/"]

    * As you can see, all calls deliver different results. To get all objects, 
    * even those starting with multiple slashes, we start with the empty prefix and 
    * * load the objects. After that, we search the results for names that only contain slashes. 
    * Remove these and recursively load with the prefix of the removed items, etc. 
    * until the results contain no objects with leading slashes.
    */
    const loadAllObjects = async (prefix = "") => {
      let objects = await loadContainerObjects(containerName, {
        prefix,
        delimiter: "/",
      }).then(({ data }) => data)

      // find index of the first object which name starts with a slash
      let regex = new RegExp(`^${prefix}/+$`)
      const startingWithSlashIndex = objects.findIndex((o) => o.subdir && o.subdir.match(regex))

      // index not found -> end of recursion
      if (startingWithSlashIndex < 0) return objects.filter((o) => o.name !== prefix)

      // get the new prefix based on the found object
      const newPrefix = objects[startingWithSlashIndex].subdir
      // remove all objects which names start with multiple slashes
      objects = objects.filter((o) => !(o.name || o.subdir).match(regex))
      // load objects recursively based on the new prefix
      let objectsStartingWithSlash = await loadAllObjects(newPrefix)
      // add new objects to the root objects
      let newObjects = objects.concat(objectsStartingWithSlash)

      // remove duplicates
      return newObjects.filter((item, index) => newObjects.indexOf(item) === index)
    }

    dispatch({ type: "REQUEST_ITEMS" })
    loadAllObjects(currentPath)
      .then((items) => {
        // extend items with display_name and sort
        items.forEach((i) => {
          // display name
          let dn = (i.name || i.subdir).replace(currentPath, "")
          if (dn[dn.length - 1] === "/") dn = dn.slice(0, -1)
          i.display_name = dn
        })
        items = items.sort((a, b) => (a.display_name > b.display_name ? 1 : a.display_name < b.display_name ? -1 : 0))
        dispatch({ type: "RECEIVE_ITEMS", items })
      })
      .catch((error) => dispatch({ type: "RECEIVE_ERROR", error: stripHtml(error.message) }))
  }, [containerName, currentPath, dispatch, loadContainerObjects])

  React.useEffect(() => {
    loadObjects()
  }, [loadObjects])

  // Return the delete function and a cancel function
  const [deleteFolder, cancelDeleteFolder] = React.useMemo(() => {
    // this variable indicates whether deletion is active
    let active

    // this is the function which deletes all objects inside a folder
    const action = (name, options = {}) => {
      confirm(
        `This folder will be irrevocably deleted. - IMPORTANT! - If the folder contains more than 50,000 objects, for performance reasons and safety considerations, please delete it using the WebShell or your CLI with "swift delete ${options.containerName || containerName} --recursive ${name}"`,
        {
          confirmLabel: "Confirm",
          abortLabel: "Cancel",
        }
      )
        .then(() => {
          const currentContainerName = options.containerName || containerName
          if (!currentContainerName || !name) return
          active = true

          // This function deletes all objects of a folder.
          // Since the number of objects to be loaded and deleted is limited,
          // we delete the objects in chunks.

          // But the deleteObjects function has also a limit of how many objects can be deleted at once.
          // Please check the deleteObjects function ../../hooks/useActions, the bulk delete is also limited to a
          // certain number of requests at a time.
          const deleteAllObjects = async () => {
            let marker
            let deletedCount = 0
            let processing = true
            // We load objects, delete them and repeat this process until there are no more objects
            while (active && processing) {
              // use prefix to limit the deletion to current folder
              await loadContainerObjects(currentContainerName, {
                marker,
                prefix: name,
              }).then(async ({ data }) => {
                if (data.length > 0 && active) {
                  // delete objects
                  await deleteObjects(currentContainerName, data)
                  // update progress
                  dispatch({
                    type: "UPDATE_ITEM",
                    name,
                    progress: (deletedCount += data.length),
                  })
                  // marker is the last item. Marker is used to load the next chunk of items.
                  marker = data.pop().name
                } else {
                  processing = false
                }
              })
            }
          }

          dispatch({ type: "UPDATE_ITEM", name, isDeleting: true })
          deleteAllObjects()
            .then(() => dispatch({ type: "REMOVE_ITEM", name }))
            .catch((error) => {
              if (!active) return
              dispatch({
                type: "UPDATE_ITEM",
                name,
                isDeleting: false,
                error: stripHtml(error.message),
              })
            })
        })
        .catch(() => null)
    }

    // return the actual action and a cancel function to cancel the delete process for large containers
    return [action, () => (active = false)]
  }, [containerName, loadContainerObjects, deleteObjects, deleteObjects, dispatch])

  // Delete a single file
  const deleteFile = React.useCallback(
    (name, options = {}) => {
      confirm("This object will be irrevocably deleted", {
        confirmLabel: "Confirm",
        abortLabel: "Cancel",
      })
        .then(() => {
          const deleteFunc = async () => {
            if (options.keepSegments !== false) {
              return deleteObject(containerName, name)
            } else {
              const metadata = await loadObjectMetadata(containerName, name)
              if (metadata["x-static-large-object"]) {
                // SLO
                return deleteObject(containerName, name, {
                  "multipart-manifest": "delete",
                })
              } else if (metadata["x-object-manifest"]) {
                // DLO
                // delete dlo manifest
                const [segmentContainer, segmentObject] = metadata["x-object-manifest"].split("/")
                return deleteObject(containerName, name).then(() =>
                  deleteFolder(segmentObject, {
                    containerName: segmentContainer,
                  })
                )
              } else {
                return deleteObject(containerName, name)
              }
            }
          }

          dispatch({ type: "UPDATE_ITEM", name, isDeleting: true })
          //deleteObject(containerName, name)
          deleteFunc()
            .then(() => dispatch({ type: "REMOVE_ITEM", name }))
            .catch((error) =>
              dispatch({
                type: "UPDATE_ITEM",
                name,
                isDeleting: false,
                error: stripHtml(error.message),
              })
            )
        })
        .catch(() => null)
    },
    [containerName, dispatch, deleteObject, deleteFolder, loadObjectMetadata]
  )

  const downloadFile = React.useCallback(
    (name, size = 0) => {
      if (size < LIMIT) {
        // less than LIMIT
        let fileName = getFileName(name)
        dispatch({ type: "UPDATE_ITEM", name, isProcessing: true })
        downloadObject(containerName, name, { fileName })
          .then(() => dispatch({ type: "UPDATE_ITEM", name, isProcessing: false }))
          .catch((error) =>
            dispatch({
              type: "UPDATE_ITEM",
              name,
              isProcessing: false,
              error: stripHtml(error.message),
            })
          )
      } else {
        history.replace(`${url}/${objectPath ? "" : encode("") + "/"}${encodeURIComponent(name)}/download-instructions`)
      }
    },
    [containerName, objectPath, loadAccountMetadataOnce, downloadObject, getFileName, dispatch, history]
  )

  // cancel current deletion process
  React.useEffect(() => {
    return () => cancelDeleteFolder && cancelDeleteFolder()
  }, [cancelDeleteFolder])

  const changeDir = React.useCallback(
    (subdir) => history.push(`${objectsRoot}/${encode(subdir)}`),
    [history, objectsRoot]
  )

  const showProperties = React.useCallback(
    (name) => {
      history.push(`${url}/${objectPath ? "" : encode("") + "/"}${encodeURIComponent(name)}/show`)
    },
    [history, objectPath, url]
  )

  const moveFile = React.useCallback(
    (name) => {
      history.push(`${url}/${objectPath ? "" : encode("") + "/"}${encodeURIComponent(name)}/move`)
    },
    [history, objectPath, url]
  )

  const copyFile = React.useCallback(
    (name) => {
      history.push(`${url}/${objectPath ? "" : encode("") + "/"}${encodeURIComponent(name)}/copy`)
    },
    [history, objectPath, url]
  )

  const handleFolderCreated = React.useCallback(
    (values) => {
      dispatch({ type: "RECEIVE_ITEM", item: values })
    },
    [dispatch]
  )

  const filteredItems = React.useMemo(() => {
    let items = objects.items

    if (searchTerm && searchTerm.length > 0) {
      items = objects.items.filter((i) => i.display_name.indexOf(searchTerm) >= 0)
    }
    return items.sort((a, b) => {
      if (a.subdir && !b.subdir) return -1
      if (!a.subdir && b.subdir) return 1
      if (a.display_name > b.display_name) return 1
      if (a.display_name < b.display_name) return -1
      return 0
    })
  }, [objects.items, searchTerm])

  return (
    <>
      <Route exact path="/containers/:name/objects/:objectPath?/new">
        <NewObject onCreated={handleFolderCreated} />
      </Route>
      <Route exact path="/containers/:name/objects/:objectPath?/upload">
        <UploadFile refresh={loadObjects} />
      </Route>
      <Route exact path="/containers/:name/objects/:objectPath?/:object/move">
        <CopyFile refresh={loadObjects} deleteAfter />
      </Route>
      <Route exact path="/containers/:name/objects/:objectPath?/:object/copy">
        <CopyFile refresh={loadObjects} showCopyMetadata />
      </Route>
      <Route exact path="/containers/:name/objects/:objectPath?/:object/show">
        <ShowProperties />
      </Route>
      <Route exact path="/containers/:name/objects/:objectPath?/:object/download-instructions">
        <DownloadInstructions />
      </Route>

      <div className="toolbar">
        <SearchField onChange={setSearchTerm} placeholder="name" text="Filters by name" />

        <div className="main-buttons">
          <Link className="btn btn-default" to={`${url}/new`}>
            Create folder
          </Link>
          <Link className="btn btn-primary" to={`${url}/upload`}>
            Upload file
          </Link>
        </div>
      </div>
      <Breadcrumb count={filteredItems.length} />
      {objects.isFetching ? (
        <span>
          <span className="spinner" /> Loading...
        </span>
      ) : objects.error ? (
        <Alert bsStyle="danger">{objects.error}</Alert>
      ) : !objects || objects.items.length === 0 ? (
        <span>No entries found.</span>
      ) : (
        <>
          {filteredItems.length > 0 ? (
            <Table
              data={filteredItems}
              changeDir={(item) => changeDir(item.subdir)}
              deleteFile={(item) => deleteFile(item.name)}
              deleteFolder={(item) => deleteFolder(item.subdir)}
              downloadFile={(item) => downloadFile(item.name, item.bytes)}
              showProperties={(item) => showProperties(item.name)}
              rawUrl={(item) =>
                rawObjectUrl(containerName, item.name, {
                  inline: 1,
                })
              }
              copyFile={(item) => copyFile(item.name)}
              moveFile={(item) => moveFile(item.name)}
            />
          ) : (
            <span>This folder is empty</span>
          )}
        </>
      )}
    </>
  )
}

export default Objects
