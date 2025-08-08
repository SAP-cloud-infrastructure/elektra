/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react"

import useStore from "../../store"

import { Button, Icon, Stack } from "@cloudoperators/juno-ui-components"

import RegionSelect from "./RegionSelect"
import DomainSelect from "./DomainSelect"

const overlayStyles = (isOpen) => {
  return `
    ${isOpen ? "tw-block" : "tw-hidden"}
    tw-backdrop-blur-xl
    tw-backdrop-saturate-200
    tw-bg-theme-background-lvl-0
    tw-bg-opacity-30
    tw-border
    tw-border-theme-background-lvl-0
    tw-flex
    tw-flex-col
    tw-absolute
    tw-inset-0
    tw-pt-24
    tw-z-[99]
    tw-overflow-y-scroll
    `
}

const tabClasses = (isActive) => {
  return `
    tw-uppercase 
    tw-text-theme-default
    tw-text-xl 
    tw-pb-3 
    tw-px-24 
    -tw-mb-0.5
    ${isActive ? "tw-cursor-default tw-text-theme-high tw-border-b-3 tw-border-theme-accent" : ""}
    `
}

const tabLinkClasses = (isActive) => {
  return `
    ${isActive ? "" : "tw-hover:text-theme-accent"}
    `
}

const LoginOverlay = () => {
  const loginOverlayVisible = useStore((state) => state.loginOverlayVisible)
  const hideLoginOverlay = useStore((state) => state.hideLoginOverlay)
  const selectedRegion = useStore((state) => state.region)
  const deselectRegion = useStore((state) => state.deselectRegion)
  const regionKeys = useStore((state) => state.regionKeys)
  const qaRegionKeys = useStore((state) => state.qaRegionKeys)
  const hideDocs = useStore((state) => state.hideDocs)
  const isValidRegionSelected = useMemo(() => {
    return selectedRegion !== null && (regionKeys.includes(selectedRegion) || qaRegionKeys.includes(selectedRegion))
  }, [selectedRegion])

  return (
    <div className={overlayStyles(loginOverlayVisible)}>
      <div className="tw-w-full tw-max-w-screen-xl tw-mx-auto tw-pb-12">
        <div className="tw-w-full tw-flex tw-items-center tw-justify-end">
          <Icon
            onClick={(e) => {
              e.preventDefault()
              hideLoginOverlay()
            }}
            icon="close"
            color="tw-text-theme-accent"
            size="36"
            className="-tw-mr-12"
          />
        </div>
        <nav className="tw-w-full tw-border-b-2 tw-border-juno-grey-light-8 tw-mb-8">
          <Stack distribution="around">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                deselectRegion()
              }}
              className={`${tabClasses(!isValidRegionSelected)} ${tabLinkClasses(!isValidRegionSelected)}`}
            >
              1. Choose your region
            </a>
            <div className={tabClasses(isValidRegionSelected)}>2. Choose your domain</div>
          </Stack>
        </nav>
        <div className="tw-w-full">{isValidRegionSelected ? <DomainSelect /> : <RegionSelect />}</div>
      </div>

      {!hideDocs && (
        <div className="tw-w-full tw-bg-juno-grey-blue-10 tw-mt-auto">
          <Stack alignment="center" className="documentation-banner tw-max-w-screen-xl tw-mx-auto tw-py-10">
            <div>
              <h5 className="tw-text-3xl">New here?</h5>
              <p>
                Have a look at the <span className="italic">Getting Started</span> section of our documentation
              </p>
            </div>
            <div className="tw-ml-auto tw-pl-8 tw-pr-20">
              <Button
                variant="primary"
                title="Go to documentation"
                href="https://documentation.global.cloud.sap/docs/customer/getting-started/"
                target="_blank"
              >
                <Icon icon="openInNew" color="tw-text-theme-high" className=" tw-mr-2" />
                Go to documentation
              </Button>
            </div>
          </Stack>
        </div>
      )}
    </div>
  )
}

export default LoginOverlay
