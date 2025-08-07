/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"

import useStore from "../../store"
import { buildDashboardLink, buildPasswordLoginLink } from "../../lib/utils"
import SapLogo from "../../assets/images/sap_logo.svg"

import { Button, Stack, PageHeader } from "@cloudoperators/juno-ui-components"

const PageHead = () => {
  const showLoginOverlay = useStore((state) => state.showLoginOverlay)
  const selectedDomain = useStore((state) => state.domain)
  const selectedRegion = useStore((state) => state.region)
  const prodMode = useStore((state) => state.prodMode)
  const hideDomainSwitcher = useStore((state) => state.hideDomainSwitcher)

  const handleLoginButtonClick = () => {
    if (selectedRegion && selectedDomain) {
      window.location.href = buildDashboardLink(selectedRegion, selectedDomain, prodMode)
    } else {
      showLoginOverlay()
    }
  }

  return (
    <PageHeader logo={<SapLogo alt="SAP" />} heading="Cloud Infrastructure">
      <Stack className="tw-ml-auto" gap="4" alignment="center">
        <>
          {selectedDomain === "CC3TEST" && (
            <a
              href={buildPasswordLoginLink(selectedRegion, selectedDomain, prodMode)}
              className="tw-text-theme-disabled hover:tw-underline"
            >
              Log in with password
            </a>
          )}
          {!hideDomainSwitcher && (
            <Button
              variant="primary"
              size="small"
              icon="manageAccounts"
              title="Log in"
              onClick={handleLoginButtonClick}
            >
              Log in
            </Button>
          )}
        </>
      </Stack>
    </PageHeader>
  )
}

export default PageHead
