import React, { useEffect, useRef } from "react"
import { Link } from "react-router-dom"
// @ts-expect-error - lib/policy has no TypeScript definitions
import { policy } from "lib/policy"
// @ts-expect-error - lib/components/Overlay has no TypeScript definitions
import { Tooltip } from "lib/components/Overlay"
import * as constants from "../../constants"
import ShareActions from "./actions"

interface Rule {
  id: string
  access_level: string
  access_to: string
}

interface ShareRules {
  isFetching: boolean
  items: Rule[]
}

interface ShareNetwork {
  id: string
  name?: string
  cidr?: string
}

interface Share {
  id: string
  name?: string
  status: string
  availability_zone?: string
  share_proto?: string
  size?: number
  isDeleting?: boolean
}

interface ShareItemProps {
  share: Share
  shareNetwork: ShareNetwork | null
  shareRules: ShareRules | null
  handleDelete: (id: string) => void
  handleForceDelete: (id: string) => void
  reloadShare: (id: string) => void
  loadShareRulesOnce: (id: string) => void
  policy: unknown
}

interface RuleTooltipProps {
  rule: Rule
  children: React.ReactNode
}

const RuleTooltip: React.FC<RuleTooltipProps> = ({ rule, children }) => {
  const al = rule.access_level

  return (
    <Tooltip
      content={`Access Level: 
        ${al === "ro" ? "read only" : al === "rw" ? "read/write" : al}`}
      placement="top"
    >
      {children}
    </Tooltip>
  )
}

const ShareItem: React.FC<ShareItemProps> = ({
  share,
  shareNetwork,
  shareRules,
  handleDelete,
  handleForceDelete,
  reloadShare,
  loadShareRulesOnce,
}) => {
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const pendingState = () => {
    return constants.isShareStatusPending(share.status)
  }

  const startPolling = () => {
    // do not create a new polling interval if already polling
    if (pollingRef.current) return
    pollingRef.current = setInterval(() => reloadShare(share.id), 5000)
  }

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  useEffect(() => {
    // Load share rules
    loadShareRulesOnce(share.id)

    // Start/stop polling based on pending state
    if (pendingState()) {
      startPolling()
    }

    // Cleanup on unmount
    return () => {
      stopPolling()
    }
  }, [share.id, share.status, loadShareRulesOnce, reloadShare])

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
            {shareNetwork.cidr && <span className="info-text">{" " + shareNetwork.cidr}</span>}
            {shareRules &&
              (shareRules.isFetching ? (
                <span className="spinner"></span>
              ) : (
                <span>
                  <br />
                  {shareRules.items.map((rule) => (
                    <RuleTooltip key={rule.id} rule={rule}>
                      <small className={`${rule.access_level === "rw" ? "text-success" : "text-info"}`}>
                        <i className={`fa fa-fw fa-${rule.access_level === "rw" ? "pencil-square" : "eye"}`} />
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
          isPending={pendingState()}
          parentView="shares"
          handleDelete={handleDelete}
          handleForceDelete={handleForceDelete}
        />
      </td>
    </tr>
  )
}

export default ShareItem
