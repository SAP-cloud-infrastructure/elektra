import { useState } from "react"
import type { UseQueryResult } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import type { InstanceDetail, InstanceMetrics, Instance } from "../../../types/instance"
import type { ComputeApi } from "../../../apiClient"
import InstanceActionsMenu from "./InstanceActionsMenu"
import type { InstanceAction } from "./instanceActions"
import { StatusPill } from "./StatusPill"
import { InformationTab } from "./tabs/InformationTab"
import { SpecsTab } from "./tabs/SpecsTab"
import { IpAddressesTab } from "./tabs/IpAddressesTab"
import { SecurityGroupsTab } from "./tabs/SecurityGroupsTab"
import { KeyPairsTab } from "./tabs/KeyPairsTab"
import { MetadataTab } from "./tabs/MetadataTab"
import { VolumesTab } from "./tabs/VolumesTab"

interface InstanceModalProps {
  detailQuery: UseQueryResult<InstanceDetail, Error>
  metricsQuery: UseQueryResult<InstanceMetrics, Error>
  onClose: () => void
  // Controlled active tab (driven by the route's `tab` search param) so links
  // can deep-link into a specific tab (e.g. the IP cell opens "IP Addresses").
  activeTab: TabName
  onTabChange: (tab: TabName) => void
  // The BFF client, threaded down so the header actions dropdown can mutate the
  // instance — same client the list uses.
  apiClient: ComputeApi
}

// Tab order mirrors the legacy compute _item_details nav: Information, Specs,
// IP Addresses, Security Groups, Key Pairs, Metadata, Volumes Attached.
export const TABS = [
  "Information",
  "Specs",
  "IP Addresses",
  "Security Groups",
  "Key Pairs",
  "Metadata",
  "Volumes Attached",
] as const

export type TabName = (typeof TABS)[number]

export function InstanceModal({
  detailQuery,
  metricsQuery,
  onClose,
  activeTab,
  onTabChange,
  apiClient,
}: InstanceModalProps) {
  const active = activeTab
  const { data: instance, isLoading, isError, error, isPlaceholderData } = detailQuery
  // Inline confirmation for destructive/confirm actions triggered from the
  // header menu. Rendered as a banner at the top of the modal body rather than
  // a second modal, so there is no nested backdrop over the detail modal.
  const [pendingConfirm, setPendingConfirm] = useState<{ action: InstanceAction; run: () => void } | null>(null)

  return (
    // Shares the host dashboard's modal chrome via lib/components/Modal. Size
    // (modal-xl) + the compute-njq scoping mirror the legacy Elektra modal
    // layout; the detail list stays mounted behind it (see the /instances
    // layout route).
    <Modal
      show
      onHide={onClose}
      dialogClassName="modal-xl"
      bsClass="compute-njq modal"
      aria-labelledby="instance-detail-title"
    >
      <Modal.Header closeButton>
        <div className="d-flex align-items-center justify-content-between w-100 me-3">
          <Modal.Title id="instance-detail-title">
            {instance ? `Server ${instance.name ?? instance.id}` : "Server"}
          </Modal.Title>
          {/* Same dropdown as the list row. InstanceDetail carries the id,
              status and locked fields visibleActions/InstanceActionsMenu use;
              scope stays {} to match the list until targeted scoping lands.
              The status pill sits to the left of the cog (as in the list) so
              the current state is visible alongside the actions. Confirm
              actions are delegated to the inline banner below instead of a
              nested modal. */}
          {instance && (
            <div className="d-flex align-items-center gap-2">
              <StatusPill status={instance.status} />
              <InstanceActionsMenu
                instance={instance as unknown as Instance}
                scope={{}}
                apiClient={apiClient}
                surface="detail"
                onConfirmRequest={(action, run) => setPendingConfirm({ action, run })}
              />
            </div>
          )}
        </div>
      </Modal.Header>
      <Modal.Body>
        {isLoading && <span className="spinner" role="status" aria-hidden="true" />}
        {isError && (
          <div className="alert alert-danger" role="alert">
            <strong>{error?.message || "Server could not be found"}</strong>
          </div>
        )}
        {instance && (
          <>
            {pendingConfirm && (
              <div className="alert alert-warning" role="alert">
                <div>
                  <strong>{pendingConfirm.action.confirm?.title}</strong>
                  <div>{pendingConfirm.action.confirm?.message}</div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-2">
                  <button type="button" className="btn btn-secondary" onClick={() => setPendingConfirm(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`btn ${pendingConfirm.action.destructive ? "btn-danger" : "btn-primary"}`}
                    onClick={() => {
                      pendingConfirm.run()
                      setPendingConfirm(null)
                    }}
                  >
                    {pendingConfirm.action.confirm?.ok}
                  </button>
                </div>
              </div>
            )}
            <ul className="nav nav-tabs" role="tablist">
              {TABS.map((tab) => (
                <li className="nav-item" role="presentation" key={tab}>
                  <button
                    type="button"
                    className={`nav-link${active === tab ? " active" : ""}`}
                    role="tab"
                    aria-selected={active === tab}
                    onClick={() => onTabChange(tab)}
                  >
                    {tab}
                  </button>
                </li>
              ))}
            </ul>
            <div className="tab-content">
              {active === "Information" && (
                <InformationTab instance={instance} metricsQuery={metricsQuery} loading={isPlaceholderData} />
              )}
              {active === "Specs" && <SpecsTab specs={instance.specs} loading={isPlaceholderData} />}
              {active === "IP Addresses" && (
                <IpAddressesTab networks={instance.ip_addresses} loading={isPlaceholderData} />
              )}
              {active === "Security Groups" && (
                <SecurityGroupsTab securityGroups={instance.security_groups} loading={isPlaceholderData} />
              )}
              {active === "Key Pairs" && <KeyPairsTab keyName={instance.key_name} loading={isPlaceholderData} />}
              {active === "Metadata" && <MetadataTab metadata={instance.metadata} loading={isPlaceholderData} />}
              {active === "Volumes Attached" && <VolumesTab volumes={instance.volumes} loading={isPlaceholderData} />}
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" aria-label="Close" onClick={onClose}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  )
}
