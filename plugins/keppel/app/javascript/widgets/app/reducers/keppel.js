import * as constants from "../constants"

const initialState = {
  accounts: {
    isFetching: false,
    requestedAt: null,
    receivedAt: null,
    data: null,
  },
  repositoriesFor: {},
  manifestsFor: {},
  manifestFor: {},
  blobFor: {},
  vulnsFor: {},
  securityPoliciesFor: {},
}

const initialRepositoriesState = {
  isFetching: false,
  requestedAt: null,
  receivedAt: null,
  data: null,
}

const initialManifestsState = {
  isFetching: false,
  requestedAt: null,
  receivedAt: null,
  data: null,
}

const initialManifestState = {
  isFetching: false,
  requestedAt: null,
  receivedAt: null,
  data: null,
}

const initialBlobState = {
  isFetching: false,
  requestedAt: null,
  receivedAt: null,
  data: null,
}

const initialVulnsState = {
  isFetching: false,
  requestedAt: null,
  receivedAt: null,
  data: null,
}

const initalSecurityPolicyState = {
  isFetching: false,
  requestedAt: null,
  receivedAt: null,
  data: null,
}

////////////////////////////////////////////////////////////////////////////////
// accounts

const reqAccts = (state, { requestedAt }) => ({
  ...state,
  accounts: {
    ...initialState.accounts,
    isFetching: true,
    requestedAt,
  },
})

const reqAcctsFail = (state) => ({
  ...state,
  accounts: {
    ...state.accounts,
    isFetching: false,
  },
})

const recvAccts = (state, { data, receivedAt }) => ({
  ...state,
  accounts: {
    ...state.accounts,
    isFetching: false,
    data,
    receivedAt,
  },
})

const updateAcct = (state, { account }) => ({
  ...state,
  accounts: {
    ...state.accounts,
    data: [...state.accounts.data.filter((a) => a.name != account.name), account],
  },
})

const deleteAcct = (state, { accountName }) => ({
  ...state,
  accounts: {
    ...state.accounts,
    data: [...state.accounts.data.filter((a) => a.name != accountName)],
  },
})

////////////////////////////////////////////////////////////////////////////////
// repositories

const reqRepos = (state, { accountName, requestedAt }) => ({
  ...state,
  repositoriesFor: {
    ...state.repositoriesFor,
    [accountName]: {
      ...initialRepositoriesState,
      isFetching: true,
      requestedAt,
    },
  },
})

const reqReposFail = (state, { accountName }) => ({
  ...state,
  repositoriesFor: {
    ...state.repositoriesFor,
    [accountName]: {
      ...state.repositoriesFor[accountName],
      isFetching: false,
      data: null,
    },
  },
})

const recvRepos = (state, { accountName, data }) => ({
  ...state,
  repositoriesFor: {
    ...state.repositoriesFor,
    [accountName]: {
      ...state.repositoriesFor[accountName],
      data: [...(state.repositoriesFor[accountName].data || []), ...data],
    },
  },
})

const recvReposDone = (state, { accountName, receivedAt }) => ({
  ...state,
  repositoriesFor: {
    ...state.repositoriesFor,
    [accountName]: {
      ...state.repositoriesFor[accountName],
      isFetching: false,
      receivedAt,
    },
  },
})

const deleteRepo = (state, { accountName, repoName }) => ({
  ...state,
  repositoriesFor: {
    ...state.repositoriesFor,
    [accountName]: {
      ...state.repositoriesFor[accountName],
      data: (state.repositoriesFor[accountName].data || []).filter((r) => r.name != repoName),
    },
  },
})

////////////////////////////////////////////////////////////////////////////////
// manifest lists

const updateManifestsFor = (state, accountName, repoName, update) => {
  const manifestsForAccount = state.manifestsFor[accountName] || {}
  return {
    ...state,
    manifestsFor: {
      ...state.manifestsFor,
      [accountName]: {
        ...manifestsForAccount,
        [repoName]: update(manifestsForAccount[repoName] || {}),
      },
    },
  }
}

const reqManifests = (state, { accountName, repoName, requestedAt }) =>
  updateManifestsFor(state, accountName, repoName, (oldState) => ({
    ...initialManifestsState,
    isFetching: true,
    requestedAt,
  }))

const reqManifestsFail = (state, { accountName, repoName }) =>
  updateManifestsFor(state, accountName, repoName, (oldState) => ({
    ...oldState,
    isFetching: false,
    data: null,
  }))

const recvManifests = (state, { accountName, repoName, data }) =>
  updateManifestsFor(state, accountName, repoName, (oldState) => ({
    ...oldState,
    data: [...(oldState.data || []), ...data],
  }))

const recvManifestsDone = (state, { accountName, repoName, receivedAt }) =>
  updateManifestsFor(state, accountName, repoName, (oldState) => ({
    ...oldState,
    isFetching: false,
    receivedAt,
  }))

////////////////////////////////////////////////////////////////////////////////
// manifests

const updateManifestFor = (state, accountName, repoName, digest, update) => {
  const manifestsForAccount = state.manifestFor[accountName] || {}
  const manifestsForRepo = manifestsForAccount[repoName] || {}
  return {
    ...state,
    manifestFor: {
      ...state.manifestFor,
      [accountName]: {
        ...manifestsForAccount,
        [repoName]: {
          ...manifestsForRepo,
          [digest]: update(manifestsForRepo[digest] || {}),
        },
      },
    },
  }
}

const reqManifest = (state, { accountName, repoName, digest, requestedAt }) =>
  updateManifestFor(state, accountName, repoName, digest, (oldState) => ({
    ...initialManifestState,
    isFetching: true,
    requestedAt,
  }))

const reqManifestFail = (state, { accountName, repoName, digest }) =>
  updateManifestFor(state, accountName, repoName, digest, (oldState) => ({
    ...oldState,
    isFetching: false,
    data: null,
  }))

const recvManifest = (state, { accountName, repoName, digest, data, receivedAt }) =>
  updateManifestFor(state, accountName, repoName, digest, (oldState) => ({
    ...oldState,
    isFetching: false,
    data,
    receivedAt,
  }))

const deleteManifest = (state, { accountName, repoName, digest }) =>
  updateManifestsFor(state, accountName, repoName, (oldState) => ({
    ...oldState,
    data: (oldState.data || []).filter((m) => m.digest != digest),
  }))

const deleteTag = (state, { accountName, repoName, tagName }) =>
  updateManifestsFor(state, accountName, repoName, (oldState) => ({
    ...oldState,
    data: (oldState.data || []).map((manifest) => {
      return {
        ...manifest,
        tags: (manifest.tags || []).filter((t) => t.name != tagName),
      }
    }),
  }))

////////////////////////////////////////////////////////////////////////////////
// blobs

const updateBlobFor = (state, accountName, repoName, digest, update) => {
  const blobsForAccount = state.blobFor[accountName] || {}
  return {
    ...state,
    blobFor: {
      ...state.blobFor,
      [accountName]: {
        ...blobsForAccount,
        [digest]: update(blobsForAccount[digest] || {}),
      },
    },
  }
}

const reqBlob = (state, { accountName, repoName, digest, requestedAt }) =>
  updateBlobFor(state, accountName, repoName, digest, (oldState) => ({
    ...initialBlobState,
    isFetching: true,
    requestedAt,
  }))

const reqBlobFail = (state, { accountName, repoName, digest }) =>
  updateBlobFor(state, accountName, repoName, digest, (oldState) => ({
    ...oldState,
    isFetching: false,
    data: null,
  }))

const recvBlob = (state, { accountName, repoName, digest, data, receivedAt }) =>
  updateBlobFor(state, accountName, repoName, digest, (oldState) => ({
    ...oldState,
    isFetching: false,
    data,
    receivedAt,
  }))

////////////////////////////////////////////////////////////////////////////////
// vulnerability reports

const updateVulnsFor = (state, accountName, repoName, digest, update) => {
  const vulnsForAccount = state.vulnsFor[accountName] || {}
  const vulnsForRepo = vulnsForAccount[repoName] || {}
  return {
    ...state,
    vulnsFor: {
      ...state.vulnsFor,
      [accountName]: {
        ...vulnsForAccount,
        [repoName]: {
          ...vulnsForRepo,
          [digest]: update(vulnsForRepo[digest] || {}),
        },
      },
    },
  }
}

const reqVulns = (state, { accountName, repoName, digest, requestedAt }) =>
  updateVulnsFor(state, accountName, repoName, digest, (oldState) => ({
    ...initialVulnsState,
    isFetching: true,
    requestedAt,
  }))

const reqVulnsFail = (state, { accountName, repoName, digest }) =>
  updateVulnsFor(state, accountName, repoName, digest, (oldState) => ({
    ...oldState,
    isFetching: false,
    data: null,
  }))

const recvVulns = (state, { accountName, repoName, digest, data, receivedAt }) =>
  updateVulnsFor(state, accountName, repoName, digest, (oldState) => ({
    ...oldState,
    isFetching: false,
    data: {
      //ensure that `data` contains at least empty values for all required keys
      packages: {},
      environments: {},
      vulnerabilities: {},
      package_vulnerabilities: {},
      ...data,
    },
    receivedAt,
  }))

////////////////////////////////////////////////////////////////////////////////
// Security scan policies
const updateSecurityPoliciesFor = (state, accountName, update) => {
  const securityPoliciesForAccount = state.securityPoliciesFor[accountName] || {}
  return {
    ...state,
    securityPoliciesFor: {
      ...state.securityPoliciesFor,
      [accountName]: update(securityPoliciesForAccount[accountName] || {}),
    },
  }
}

const reqSecurityPolicies = (state, { accountName, requestedAt }) =>
  updateSecurityPoliciesFor(state, accountName, (oldState) => ({
    ...initalSecurityPolicyState,
    isFetching: true,
    requestedAt,
  }))

const recvSecurityPolicies = (state, { accountName, data, receivedAt }) =>
  updateSecurityPoliciesFor(state, accountName, (oldState) => ({
    ...oldState,
    isFetching: false,
    data,
    receivedAt,
  }))

const reqSecurityPoliciesFail = (state, { accountName }) =>
  updateSecurityPoliciesFor(state, accountName, (oldState) => ({
    ...oldState,
    isFetching: false,
    data: null,
  }))

const updateSecurityPolicies = (state, { accountName, data }) =>
  updateSecurityPoliciesFor(state, accountName, (oldState) => ({
    ...oldState,
    isFetching: false,
    data,
  }))

////////////////////////////////////////////////////////////////////////////////

export const keppel = (state, action) => {
  if (state == null) {
    state = initialState
  }

  switch (action.type) {
    case constants.REQUEST_ACCOUNTS:
      return reqAccts(state, action)
    case constants.REQUEST_ACCOUNTS_FAILURE:
      return reqAcctsFail(state)
    case constants.RECEIVE_ACCOUNTS:
      return recvAccts(state, action)
    case constants.UPDATE_ACCOUNT:
      return updateAcct(state, action)
    case constants.DELETE_ACCOUNT:
      return deleteAcct(state, action)
    case constants.REQUEST_REPOSITORIES:
      return reqRepos(state, action)
    case constants.REQUEST_REPOSITORIES_FAILURE:
      return reqReposFail(state, action)
    case constants.RECEIVE_REPOSITORIES:
      return recvRepos(state, action)
    case constants.REQUEST_REPOSITORIES_FINISHED:
      return recvReposDone(state, action)
    case constants.DELETE_REPOSITORY:
      return deleteRepo(state, action)
    case constants.REQUEST_MANIFESTS:
      return reqManifests(state, action)
    case constants.REQUEST_MANIFESTS_FAILURE:
      return reqManifestsFail(state, action)
    case constants.RECEIVE_MANIFESTS:
      return recvManifests(state, action)
    case constants.REQUEST_MANIFESTS_FINISHED:
      return recvManifestsDone(state, action)
    case constants.REQUEST_MANIFEST:
      return reqManifest(state, action)
    case constants.REQUEST_MANIFEST_FAILURE:
      return reqManifestFail(state, action)
    case constants.RECEIVE_MANIFEST:
      return recvManifest(state, action)
    case constants.DELETE_MANIFEST:
      return deleteManifest(state, action)
    case constants.DELETE_TAG:
      return deleteTag(state, action)
    case constants.REQUEST_BLOB:
      return reqBlob(state, action)
    case constants.REQUEST_BLOB_FAILURE:
      return reqBlobFail(state, action)
    case constants.RECEIVE_BLOB:
      return recvBlob(state, action)
    case constants.REQUEST_VULNS:
      return reqVulns(state, action)
    case constants.REQUEST_VULNS_FAILURE:
      return reqVulnsFail(state, action)
    case constants.RECEIVE_VULNS:
      return recvVulns(state, action)
    case constants.REQUEST_SECURITY_SCAN_POLICIES:
      return reqSecurityPolicies(state, action)
    case constants.RECEIVE_SECURITY_SCAN_POLICIES:
      return recvSecurityPolicies(state, action)
    case constants.REQUEST_SECURITY_SCAN_POLICIES_FAILURE:
      return reqSecurityPoliciesFail(state, action)
    case constants.UPDATE_SECURITY_SCAN_POLICIES:
      return updateSecurityPolicies(state, action)
    default:
      return state
  }
}
