import React, { useState } from "react"
import { Button } from "react-bootstrap"
import Log from "./shared/logger"

const serverError = (errorText, onReload) => {
  return (
    <>
      <p>{errorText}</p>
      <p>
        Please try later again
        {onReload && (
          <>
            <span> or try reloading.</span>
          </>
        )}
      </p>
      {onReload && (
        <div className="ep-reload-button">
          <Button variant="primary" onClick={onReload}>
            Reload <i className="fa fa-refresh"></i>
          </Button>
        </div>
      )}
    </>
  )
}

const subTitle = (error) => {
  if (error?.status && error?.statusText) {
    return (
      <p>
        <b>{error.status}</b> {error.statusText}
      </p>
    )
  } else {
    if (error?.status) {
      return (
        <p>
          Error <b>{error.status}</b>
        </p>
      )
    }
  }
  return null
}

const description = (error, onReload) => {
  const errorText =
    "There was an error. Don't worry, it's not you - it's us. Sorry about that."
  const httpStatus = (error && error.status) || error.status

  // internal errors
  if (!httpStatus) {
    return serverError(error, onReload)
  }

  // rest api call errors
  if (httpStatus >= 500) {
    return serverError(errorText, onReload)
  } else if (httpStatus == 404) {
    return <p>That’s an error. The requested entity was not found</p>
  } else if (httpStatus >= 400 && httpStatus < 500) {
    return null
  } else {
    return serverError(errorText, onReload)
  }
}

const ErrorPage = ({ error, headTitle, onReload }) => {
  Log.debug("RENDER error page")
  const [showDetails, setShowDetails] = useState(false)
  const err = error.error || error

  const details = () => {
    const errorDetails =
      (err.data && (err.data.errors || err.data.error)) || err.message
    return errorDetails
  }

  return (
    <>
      <div className="row error-page">
        <div className="col-md-10 col-md-offset-2">
          <div className="row">
            <div className="col-md-10">
              <h3>{headTitle}</h3>
              {subTitle(err)}
              {description(err, onReload)}
              {details() && (
                <>
                  <div className="display-flex">
                    <div
                      className="action-link"
                      onClick={() => setShowDetails(!showDetails)}
                      data-toggle="collapse"
                      data-target="#collapseDetails"
                      aria-expanded={showDetails}
                      aria-controls="collapseDetails"
                    >
                      {showDetails ? (
                        <>
                          <span>Hide details</span>
                          <i className="fa fa-chevron-circle-up" />
                        </>
                      ) : (
                        <>
                          <span>Show details</span>
                          <i className="fa fa-chevron-circle-down" />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="collapse" id="collapseDetails">
                    <pre>
                      <code>{details()}</code>
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ErrorPage
