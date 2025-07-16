/*
 * SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Juno contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react"

import { Button, Icon, PageFooter as JunoFooter, Stack } from "@cloudoperators/juno-ui-components"

import DocumentationIcon from "../../assets/images/icon_documentation.svg"
import SlackIcon from "../../assets/images/icon_slack.svg"
import SupportIcon from "../../assets/images/icon_support.svg"

const headlineStyles = `
  tw-font-bold
  tw-pb-6
  tw-text-base
`

const boxStyles = `
  tw-pt-6
  tw-pb-8
  tw-px-12
  tw-rounded
`

const noBgBoxStyles = `
  tw-pt-6
`

const PageFooter = () => {
  return (
    <>
      <div className="footer">
        <div className="tw-max-w-[1280px] tw-mx-auto tw-grid tw-grid-rows-[1fr,0.24fr] tw-grid-cols-3 tw-gap-x-20 tw-gap-y-8 tw-pb-12 tw-pt-[calc(2rem+var(--cloud-image-overlap))]">
          <Stack direction="vertical" className={`tw-row-span-2 tw-bg-juno-grey-blue-11 ${boxStyles}`}>
            <DocumentationIcon className="tw-mb-3" />
            <h5 className={headlineStyles}>
              <span className="tw-text-theme-accent">Documentation</span>
              <br />
              Detailed information
            </h5>
            <p>
              The documentation has detailed information about all the services that Converged Cloud offers including
              how-tos and tutorials.
            </p>
            <div className="tw-mt-auto">
              <Button
                label="Read the documentation"
                href="https://documentation.global.cloud.sap/"
                icon="description"
                size="small"
                target="_blank"
                className="tw-w-auto"
              />
            </div>
          </Stack>

          <Stack direction="vertical" className={noBgBoxStyles}>
            <SlackIcon className="tw-mb-3" />
            <h5 className={headlineStyles}>
              <span className="tw-text-theme-accent">Join the community</span>
              <br />
              Ask questions and connect with others
            </h5>
            <p className="tw-pb-6">
              Join the #sap-cc-users channel on Slack to connect with other users or ask questions.
            </p>
            <div className="tw-mt-auto">
              <Button
                label="Find our Slack channel"
                href="https://convergedcloud.slack.com/archives/C374AQJ3W"
                icon="forum"
                size="small"
                target="_blank"
                variant="subdued"
                className="tw-w-auto"
              />
            </div>
          </Stack>

          <Stack direction="vertical" className={noBgBoxStyles}>
            <SupportIcon className="tw-mb-3" />
            <h5 className={headlineStyles}>
              <span className="tw-text-theme-accent">Need help?</span>
              <br />
              Contact our support team *
            </h5>
            <p className="tw-pb-6">
              Our support team is available during EMEA business hours and for emergencies we offer 24/7 premium
              support.
            </p>
            <div className="tw-mt-auto">
              <Button
                label="Contact our support"
                href="https://documentation.global.cloud.sap/docs/customer/docs/support/contact-us/"
                icon="comment"
                size="small"
                target="_blank"
                variant="subdued"
                className="tw-w-auto"
              />
            </div>
          </Stack>

          <a
            className="tw-group tw-block tw-col-span-2 tw-bg-theme-accent tw-text-juno-grey-blue-11 tw-rounded"
            href="https://documentation.global.cloud.sap/docs/customer/docs/support/service-now-ticket-creation/support-prod-sys-down/"
            rel="noreferrer"
            target="_blank"
          >
            <Stack gap="2">
              <div className="tw-text-2xl tw-font-bold tw-py-2 tw-pl-8">*</div>
              <div className="tw-py-2">
                <div className="tw-text-2xl tw-font-bold">Premium 24 hour emergency support</div>
                For emergencies in productive systems.
              </div>
              <Stack
                direction="vertical"
                alignment="center"
                distribution="center"
                className="tw-bg-juno-grey-blue-11 tw-ml-auto tw-px-4 tw-py-2 tw-font-bold tw-text-theme-accent tw-group-hover:text-white"
              >
                <Icon icon="exitToApp" size="32" />
                <div>Learn more</div>
              </Stack>
            </Stack>
          </a>
        </div>
      </div>

      <JunoFooter />
    </>
  )
}

export default PageFooter
