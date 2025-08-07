export const REQUEST_ACCOUNTS = "keppel/REQUEST_ACCOUNTS"
export const RECEIVE_ACCOUNTS = "keppel/RECEIVE_ACCOUNTS"
export const REQUEST_ACCOUNTS_FAILURE = "keppel/REQUEST_ACCOUNTS_FAILURE"
export const UPDATE_ACCOUNT = "keppel/UPDATE_ACCOUNT"
export const DELETE_ACCOUNT = "keppel/DELETE_ACCOUNT"

export const REQUEST_PEERS = "keppel/REQUEST_PEERS"
export const RECEIVE_PEERS = "keppel/RECEIVE_PEERS"
export const REQUEST_PEERS_FAILURE = "keppel/REQUEST_PEERS_FAILURE"

export const REQUEST_REPOSITORIES = "keppel/REQUEST_REPOSITORIES"
export const RECEIVE_REPOSITORIES = "keppel/RECEIVE_REPOSITORIES"
export const REQUEST_REPOSITORIES_FINISHED = "keppel/REQUEST_REPOSITORIES_FINISHED"
export const REQUEST_REPOSITORIES_FAILURE = "keppel/REQUEST_REPOSITORIES_FAILURE"
export const DELETE_REPOSITORY = "keppel/DELETE_REPOSITORY"

export const REQUEST_MANIFESTS = "keppel/REQUEST_MANIFESTS"
export const RECEIVE_MANIFESTS = "keppel/RECEIVE_MANIFESTS"
export const REQUEST_MANIFESTS_FINISHED = "keppel/REQUEST_MANIFESTS_FINISHED"
export const REQUEST_MANIFESTS_FAILURE = "keppel/REQUEST_MANIFESTS_FAILURE"
export const REQUEST_MANIFEST = "keppel/REQUEST_MANIFEST"
export const RECEIVE_MANIFEST = "keppel/RECEIVE_MANIFEST"
export const REQUEST_MANIFEST_FAILURE = "keppel/REQUEST_MANIFEST_FAILURE"
export const DELETE_MANIFEST = "keppel/DELETE_MANIFEST"

export const DELETE_TAG = "keppel/DELETE_TAG"

export const REQUEST_BLOB = "keppel/REQUEST_BLOB"
export const RECEIVE_BLOB = "keppel/RECEIVE_BLOB"
export const REQUEST_BLOB_FAILURE = "keppel/REQUEST_BLOB_FAILURE"

export const REQUEST_VULNS = "keppel/REQUEST_VULNS"
export const RECEIVE_VULNS = "keppel/RECEIVE_VULNS"
export const REQUEST_VULNS_FAILURE = "keppel/REQUEST_VULNS_FAILURE"

export const REQUEST_SECURITY_SCAN_POLICIES = "keppel/REQUEST_SECURITY_SCAN_POLICIES"
export const RECEIVE_SECURITY_SCAN_POLICIES = "keppel/RECEIVE_SECURITY_SCAN_POLICIES"
export const REQUEST_SECURITY_SCAN_POLICIES_FAILURE = "keppel/REQUEST_SECURITY_SCAN_POLICIES_FAILURE"
export const UPDATE_SECURITY_SCAN_POLICIES = "keppel/UPDATE_SECURITY_SCAN_POLICIES"

//Sorting order for severities in image list and image details views.
//A vulnerability report is available for all non-negative values.
export const SEVERITY_ORDER = {
  // pseudo-severities
  Error: -3, // error encountered while scanning
  Pending: -2, // not scanned yet
  Unsupported: -1, // Keppel refuses to scan this
  Clean: 0, // no vulnerabilities found
  // real severity values
  Unknown: 1,
  Low: 2,
  Medium: 3,
  High: 4,
  Critical: 5,
  Rotten: 6, //base OS is out of support
}

//Keppel uses title-case for vulnerability status strings, but Trivy severities
//are in full upper case.
export const TRIVY_TO_KEPPEL_SEVERITY = {
  UNKNOWN: "Unknown",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
}
