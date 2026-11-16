import type { UseQueryResult } from "@tanstack/react-query"
import { Modal } from "lib/components/Modal"
import type { InstanceDetail, InstanceMetrics } from "../../../types/instance"
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

export function InstanceModal({ detailQuery, metricsQuery, onClose, activeTab, onTabChange }: InstanceModalProps) {
  const active = activeTab
  const { data: instance, isLoading, isError, error, isPlaceholderData } = detailQuery

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
        <Modal.Title id="instance-detail-title">
          {instance ? `Server ${instance.name ?? instance.id}` : "Server"}
        </Modal.Title>
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
