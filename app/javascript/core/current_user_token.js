const getUserToken = async () => {
  let path = "os-api/__token"
  if (window.scopedProjectFid) path = `${window.scopedProjectFid}/${path}`
  if (window.scopedDomainFid) path = `${window.scopedDomainFid}/${path}`

  if (window.scopedDomainFid || (!window.scopedDomainFid && !window.scopedProjectFid)) {
    path = `/${path}`
  }
  return fetch(path)
    .then((response) => response.json())
    .then((token) => {
      const authToken = token.value
      delete token.value
      return {
        authToken,
        ...token,
      }
    })
}

window._getCurrentToken = window._getCurrentToken || getUserToken

// example
// window
//   ._getCurrentToken()
//   .then((token) => console.log("--------------------------", token))
