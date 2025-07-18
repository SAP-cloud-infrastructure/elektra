import React from "react"
import { ajaxHelper } from "lib/ajax_helper"
import { confirm } from "lib/dialogs"
import { addError } from "lib/flashes"
import { ErrorsList } from "lib/elektra-form/components/errors_list"

import * as constants from "../constants"

const errorMessage = (error) => error.data || error.message

/* global React */
const showError = (error) =>
  addError(
    React.createElement(ErrorsList, {
      errors: errorMessage(error),
    })
  )

////////////////////////////////////////////////////////////////////////////////
// get/set accounts

export const fetchAccounts = () => (dispatch) => {
  dispatch({
    type: constants.REQUEST_ACCOUNTS,
    requestedAt: Date.now(),
  })

  return ajaxHelper
    .get("/keppel/v1/accounts")
    .then((response) => {
      dispatch({
        type: constants.RECEIVE_ACCOUNTS,
        data: response.data.accounts,
        receivedAt: Date.now(),
      })
    })
    .catch((error) => {
      dispatch({ type: constants.REQUEST_ACCOUNTS_FAILURE })
      showError(error)
    })
}

export const fetchAccountsIfNeeded = () => (dispatch, getState) => {
  const state = getState().keppel.accounts
  if (state.isFetching || state.requestedAt) {
    return
  }
  return dispatch(fetchAccounts())
}

export const putAccount =
  (account, requestHeaders = {}) =>
  (dispatch) => {
    //request body contains account minus name
    const { name, ...accountConfig } = account
    const requestBody = { account: accountConfig }

    return new Promise((resolve, reject) =>
      ajaxHelper
        .put(`/keppel/v1/accounts/${name}`, requestBody, {
          headers: requestHeaders,
        })
        .then((response) => {
          const newAccount = response.data.account
          dispatch({
            type: constants.UPDATE_ACCOUNT,
            account: newAccount,
          })
          resolve(newAccount)
        })
        .catch((error) => reject({ errors: errorMessage(error) }))
    )
  }

export const deleteAccount = (accountName) => (dispatch) => {
  return new Promise((resolve, reject) =>
    ajaxHelper
      .delete(`/keppel/v1/accounts/${accountName}`)
      .then(() => {
        dispatch({
          type: constants.DELETE_ACCOUNT,
          accountName,
        })
        resolve({ success: true })
      })
      .catch((error) => {
        if (error.status == 409) {
          const body = error.data
          if (body?.error) {
            showError({ message: body?.error })
            reject()
          } else {
            //response contains instructions about how to proceed with
            //remaining_manifests or remaining_blobs - inform caller
            resolve({ success: false, body })
          }
        } else {
          showError(error)
          reject()
        }
      })
  )
}

export const getAccountSubleaseToken = (accountName) => (dispatch) => {
  return new Promise((resolve, reject) =>
    ajaxHelper
      .post(`/keppel/v1/accounts/${accountName}/sublease`)
      .then((response) => resolve(response.data.sublease_token))
      .catch((error) => reject(errorMessage(error)))
  )
}

////////////////////////////////////////////////////////////////////////////////
// get repositories

const fetchRepositoryPage = (accountName, marker) => (dispatch) => {
  //send REQUEST_REPOSITORIES only once at the start of the operation
  if (marker == null) {
    dispatch({
      type: constants.REQUEST_REPOSITORIES,
      accountName,
      requestedAt: Date.now(),
    })
  }

  ajaxHelper
    .get(`/keppel/v1/accounts/${accountName}/repositories`, {
      params: { marker },
    })
    .then((response) => {
      const repos = response.data.repositories
      dispatch({
        type: constants.RECEIVE_REPOSITORIES,
        accountName,
        data: repos,
        receivedAt: Date.now(),
      })
      if (response.data.truncated) {
        fetchRepositoryPage(accountName, repos[repos.length - 1].name)
      } else {
        dispatch({
          type: constants.REQUEST_REPOSITORIES_FINISHED,
          accountName,
          receivedAt: Date.now(),
        })
      }
    })
    .catch((error) => {
      dispatch({
        type: constants.REQUEST_REPOSITORIES_FAILURE,
        accountName,
      })
      showError(error)
    })
}

export const fetchRepositoriesIfNeeded = (accountName) => (dispatch, getState) => {
  const state = getState().keppel.repositoriesFor[accountName] || {}
  if (state.isFetching || state.requestedAt) {
    return
  }
  return dispatch(fetchRepositoryPage(accountName, null))
}

export const deleteRepository = (accountName, repoName) => (dispatch) => {
  return new Promise((resolve, reject) =>
    ajaxHelper
      .delete(`/keppel/v1/accounts/${accountName}/repositories/${repoName}`)
      .then(() => {
        dispatch({
          type: constants.DELETE_REPOSITORY,
          accountName,
          repoName,
        })
        resolve()
      })
      .catch((error) => {
        showError(error)
        reject()
      })
  )
}

////////////////////////////////////////////////////////////////////////////////
// get manifests

const fetchManifestPage = (accountName, repoName, marker) => (dispatch) => {
  //send REQUEST_MANIFESTS only once at the start of the operation
  if (marker == null) {
    dispatch({
      type: constants.REQUEST_MANIFESTS,
      accountName,
      repoName,
      requestedAt: Date.now(),
    })
  }

  ajaxHelper
    .get(`/keppel/v1/accounts/${accountName}/repositories/${repoName}/_manifests`, { params: { marker } })
    .then((response) => {
      const manifests = response.data.manifests
      dispatch({
        type: constants.RECEIVE_MANIFESTS,
        accountName,
        repoName,
        data: manifests,
        receivedAt: Date.now(),
      })
      if (response.data.truncated) {
        dispatch(fetchManifestPage(accountName, repoName, manifests[manifests.length - 1].digest))
      } else {
        dispatch({
          type: constants.REQUEST_MANIFESTS_FINISHED,
          accountName,
          repoName,
          receivedAt: Date.now(),
        })
      }
    })
    .catch((error) => {
      dispatch({
        type: constants.REQUEST_MANIFESTS_FAILURE,
        accountName,
        repoName,
      })
      showError(error)
    })
}

export const fetchManifestsIfNeeded = (accountName, repoName) => (dispatch, getState) => {
  const state = (getState().keppel.manifestsFor[accountName] || {})[repoName] || {}
  if (state.isFetching || state.requestedAt) {
    return
  }
  return dispatch(fetchManifestPage(accountName, repoName, null))
}

const fetchManifest = (accountName, repoName, digest) => (dispatch) => {
  dispatch({
    type: constants.REQUEST_MANIFEST,
    accountName,
    repoName,
    digest,
    requestedAt: Date.now(),
  })

  ajaxHelper
    .get(`/v2/${accountName}/${repoName}/manifests/${digest}`)
    .then((response) => {
      dispatch({
        type: constants.RECEIVE_MANIFEST,
        accountName,
        repoName,
        digest,
        data: response.data,
        receivedAt: Date.now(),
      })
    })
    .catch((error) => {
      dispatch({
        type: constants.REQUEST_MANIFEST_FAILURE,
        accountName,
        repoName,
        digest,
      })
      showError(error)
    })
}

export const fetchManifestIfNeeded = (accountName, repoName, digest) => (dispatch, getState) => {
  const state = ((getState().keppel.manifestFor[accountName] || {})[repoName] || {})[digest] || {}
  if (state.isFetching || state.requestedAt) {
    return
  }
  return dispatch(fetchManifest(accountName, repoName, digest))
}

export const deleteManifest = (accountName, repoName, digest, tagName) => (dispatch, getState) => {
  //when `tagName` is non-empty, the user has selected this tag for deletion,
  //and we should ask for confirmation before deleting the manifest if it is
  //also referenced by other tags
  const otherTagNames = (() => {
    if (!tagName) {
      return []
    }
    const manifestsForAccount = getState().keppel.manifestsFor[accountName] || {}
    const manifestsForRepo = manifestsForAccount[repoName] || {}
    const manifestInfo = (manifestsForRepo.data || []).find((m) => m.digest === digest) || {}
    const manifestTags = manifestInfo.tags || []
    return manifestTags.map((t) => t.name).filter((n) => n != tagName)
  })()

  return new Promise((resolve, reject) => {
    const precondition =
      otherTagNames.length == 0
        ? Promise.resolve(null)
        : confirm(
            `Really delete this image? It is also tagged as ${otherTagNames
              .map((n) => `"${n}"`)
              .join(", ")} and those tags will be deleted as well.`
          )

    precondition
      .then(() =>
        ajaxHelper
          .delete(`/keppel/v1/accounts/${accountName}/repositories/${repoName}/_manifests/${digest}`)
          .then(() => {
            dispatch({
              type: constants.DELETE_MANIFEST,
              accountName,
              repoName,
              digest,
            })
            resolve()
          })
          .catch((error) => {
            showError(error)
            reject()
          })
      )
      .catch(() => reject())
  })
}

export const deleteTag = (accountName, repoName, tagName) => (dispatch) => {
  return new Promise((resolve, reject) => {
    ajaxHelper
      .delete(`/keppel/v1/accounts/${accountName}/repositories/${repoName}/_tags/${tagName}`)
      .then(() => {
        dispatch({
          type: constants.DELETE_TAG,
          accountName,
          repoName,
          tagName,
        })
        resolve()
      })
      .catch((error) => {
        showError(error)
        reject()
      })
  })
}

////////////////////////////////////////////////////////////////////////////////
// get blobs

const fetchBlob = (accountName, repoName, digest) => (dispatch) => {
  dispatch({
    type: constants.REQUEST_BLOB,
    accountName,
    repoName,
    digest,
    requestedAt: Date.now(),
  })

  ajaxHelper
    .get(`/v2/${accountName}/${repoName}/blobs/${digest}`)
    .then((response) => {
      dispatch({
        type: constants.RECEIVE_BLOB,
        accountName,
        repoName,
        digest,
        data: response.data,
        receivedAt: Date.now(),
      })
    })
    .catch((error) => {
      dispatch({
        type: constants.REQUEST_BLOB_FAILURE,
        accountName,
        repoName,
        digest,
      })
      showError(error)
    })
}

export const fetchBlobIfNeeded = (accountName, repoName, digest) => (dispatch, getState) => {
  const state = (getState().keppel.blobFor[accountName] || {})[digest] || {}
  if (state.isFetching || state.requestedAt) {
    return
  }
  return dispatch(fetchBlob(accountName, repoName, digest))
}

////////////////////////////////////////////////////////////////////////////////
// get vulnerabilities

const fetchVulns = (accountName, repoName, digest) => (dispatch) => {
  dispatch({
    type: constants.REQUEST_VULNS,
    accountName,
    repoName,
    digest,
    requestedAt: Date.now(),
  })

  ajaxHelper
    .get(`/keppel/v1/accounts/${accountName}/repositories/${repoName}/_manifests/${digest}/trivy_report`)
    .then((response) => {
      dispatch({
        type: constants.RECEIVE_VULNS,
        accountName,
        repoName,
        digest,
        data: response.data,
        receivedAt: Date.now(),
      })
    })
    .catch((error) => {
      dispatch({
        type: constants.REQUEST_VULNS_FAILURE,
        accountName,
        repoName,
        digest,
      })
      showError(error)
    })
}

export const fetchVulnsIfNeeded = (accountName, repoName, digest) => (dispatch, getState) => {
  const state = ((getState().keppel.vulnsFor[accountName] || {})[repoName] || {})[digest] || {}
  if (state.isFetching || state.requestedAt) {
    return
  }
  return dispatch(fetchVulns(accountName, repoName, digest))
}

////////////////////////////////////////////////////////////////////////////////
// get security scan policies

const fetchSecurityScanPolicies = (accountName) => (dispatch) => {
  dispatch({
    type: constants.REQUEST_SECURITY_SCAN_POLICIES,
    accountName: accountName,
    requestedAt: Date.now(),
  })

  return ajaxHelper
    .get(`/keppel/v1/accounts/${accountName}/security_scan_policies`)
    .then((response) => {
      dispatch({
        type: constants.RECEIVE_SECURITY_SCAN_POLICIES,
        data: response.data.policies,
        accountName: accountName,
        receivedAt: Date.now(),
      })
    })
    .catch((error) => {
      dispatch({ type: constants.REQUEST_SECURITY_SCAN_POLICIES_FAILURE, accountName: accountName })
      showError(error)
    })
}

export const fetchSecurityScanPoliciesIfNeeded = (accountName) => (dispatch, getState) => {
  const state = getState().keppel.securityPoliciesFor[accountName] || {}
  if (state.isFetching || state.requestedAt) {
    return
  }
  return dispatch(fetchSecurityScanPolicies(accountName))
}

export const putSecurityScanPolicies =
  (accountName, policies, requestHeaders = {}) =>
  (dispatch) => {
    const requestBody = { policies: policies }

    return new Promise((resolve, reject) =>
      ajaxHelper
        .put(`/keppel/v1/accounts/${accountName}/security_scan_policies`, requestBody, {
          headers: requestHeaders,
        })
        .then((response) => {
          const newPolicies = response.data.policies
          dispatch({
            type: constants.UPDATE_SECURITY_SCAN_POLICIES,
            accountName: accountName,
            data: newPolicies,
          })
          resolve(newPolicies)
        })
        .catch((error) => reject({ errors: errorMessage(error) }))
    )
  }
