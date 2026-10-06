import React from "react"
import PropTypes from "prop-types"
import { createUseStyles } from "react-jss"

const useStyles = createUseStyles({
  breakWord: { wordWrap: "break-word" },
  info: { margin: "0 0 0 0" },
  rowDivider: {
    marginTop: 5,
    marginBottom: 5,
  },
})

const aclTitle = (acl) => {
  switch (acl.type) {
    case ".rlistings":
      return "Any user can perform a HEAD or GET operation on the container provided the user also has read access on objects."
    case ".r:*":
      return "Any user has access to objects. No token is required in the request."
    case ".r:<referer>":
      return `The referer ${acl.referer} has granted access to objects. No token is required.`
    case ".r:-<referer>":
      return `The referer ${acl.referer} has no access to objects. However, it does not deny access if another element (e.g., .r:*) grants access.`
    case ".*:*":
      return "Any user has access. Note: The *:* element differs from the .r:* element because *:* requires that a valid token is included in the request whereas .r:* does not require a token."
    case "<project-id>:<user-id>":
      return `The specified domain/user: ${acl.user} with a token scoped to the domain/project: ${acl.project} has granted access.`
    case "<project-id>:*":
      return `Any user with a role in the domain/project: ${acl.project} has access. A token scoped to the project must be included in the request.`
    case "*:<user-id>":
      return `The specified domain/user: ${acl.user} has access. A token for the user (scoped to any project) must be included in the request.`
    case "<role_name>":
      return `A user ${acl.user} has access on the container. A user token scoped to the project ${window.scoped_domain_name}/${window.scoped_project_name} must be included in the request.`
    default:
      return "Not supported"
  }
}

const AclsResolution = ({ title, acls }) => {
  const classes = useStyles()
  const error = React.useMemo(() => acls.error_happened, [acls])
  const keys = React.useMemo(
    () =>
      Object.keys(acls).filter(
        (k) => k !== "error_happened" && k !== "undefined"
      ),
    [acls]
  )

  return (
    <>
      <h5>{title}</h5>
      <div className={`card ${error ? "border-danger" : "border-success"}`}>
        <div className="card-body">
          {keys.length === 0
            ? `No ${title} found`
            : keys.map((key, i) => (
                <React.Fragment key={i}>
                  <div className="row">
                    <div className="col-md-6 text-truncate">
                      {acls[key].error ? (
                        <span>
                          <strong>Error: </strong>
                          <span className="text-danger">{acls[key].error}</span>
                        </span>
                      ) : (
                        <div>
                          <span title={aclTitle(acls[key])}>
                            {acls[key].user && (
                              <strong>{acls[key].user} </strong>
                            )}
                            {acls[key].project && acls[key].token && (
                              <span>
                                for projectscope
                                <strong> {acls[key].project} </strong>
                              </span>
                            )}
                            {acls[key].operation && (
                              <strong>{acls[key].operation}</strong>
                            )}
                          </span>
                          {!acls[key].error && (
                            <p className={classes.info}>
                              <small>
                                valid token required: {`${acls[key].token}`}
                              </small>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className={`col-md-6 ${classes.breakWord}`}>{key}</div>
                  </div>
                  {i < keys.length - 1 && <hr className={classes.rowDivider} />}
                </React.Fragment>
              ))}
        </div>
      </div>
    </>
  )
}

AclsResolution.propTypes = {
  title: PropTypes.string,
  acls: PropTypes.object,
}

export default AclsResolution
