import React, { useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { policy } from "lib/policy"
import { Tooltip } from "lib/components/Overlay"
import * as constants from "../../constants"
import ShareActions from "./actions"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Rule {
  id: string
  access_level: string
  access_to: string
}

interface ShareRulesState {
  isFetching: boolean
  items: Rule[]
}

interface Share {
  id: string
  name?: string
  availability_zone?: string
  share_proto?: string
  size?: number
  status: string
  isDeleting?: boolean
}

interface ShareNetwork {
  id: string
  name?: string
  cidr?: string
}

interface ShareItemProps {
  share: Share
  shareNetwork?: ShareNetwork | null
  shareRules?: ShareRulesState | null
  handleDelete: (id: string) => void
  handleForceDelete: (id: string) => void
  reloadShare: (id: string) => void
  loadShareRulesOnce: (id: string) => void
}

// ─── RuleTooltip ──────────────────────────────────────────────────────────────

const RuleTooltip: React.FC<{ rule: Rule; children: React.ReactNode }> = ({ rule, children }) => {
  const al = rule.access_level
  const label = al === "ro" ? "read only" : al === "rw" ? "read/write" : al
  return (
    <Tooltip content={`Access Level: \n        ${label}`} placement="top">
      {children}
    </Tooltip>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

const ShareItem: React.FC<ShareItemProps> = ({
  share,
  shareNetwork,
  shareRules,
  handleDelete,
  handleForceDelete,
  reloadShare,
  loadShareRulesOnce,
}) => {
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isPending = constants.isShareStatusPending(share.status)

  useEffect(() => {
    loadShareRulesOnce(share.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share.id])

  useEffect(() => {
    if (isPending) {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => reloadShare(share.id), 5000)
      }
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [share.status])

  return (
    <tr className={share.isDeleting ? "updating" : ""}>
      <td>
        <Link to={`/shares/${share.id}/show`}>{share.name || share.id}</Link>
      </td>
      <td>{share.availability_zone}</td>
      <td>{share.share_proto}</td>
      <td>{(share.size || 0) + " GB"}</td>
      <td>
        {share.status === "creating" && <span className="spinner"></span>}
        {share.status}
      </td>
      <td>
        {shareNetwork ? (
          <span>
            {shareNetwork.name}
            {shareNetwork.cidr && (
              <span className="info-text">{" " + shareNetwork.cidr}</span>
            )}
            {shareRules &&
              (shareRules.isFetching ? (
                <span className="spinner"></span>
              ) : (
                <span>
                  <br />
                  {shareRules.items.map((rule) => (
                    <RuleTooltip key={rule.id} rule={rule}>
                      <small
                        className={rule.access_level === "rw" ? "text-success" : "text-info"}
                      >
                        <i
                          className={`fa fa-fw fa-${
                            rule.access_level === "rw" ? "pencil-square" : "eye"
                          }`}
                        />
                        {rule.access_to}
                      </small>
                    </RuleTooltip>
                  ))}
                </span>
              ))}
          </span>
        ) : (
          <span className="spinner"></span>
        )}
      </td>
      <td className="snug">
        <ShareActions
          share={share}
          isPending={isPending}
          parentView="shares"
          handleDelete={handleDelete}
          handleForceDelete={handleForceDelete}
          policy={policy}
        />
      </td>
    </tr>
  )
}

export default ShareItem
