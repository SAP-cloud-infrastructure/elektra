const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("dns", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open dns page and test Request New Zone dialog", () => {
    cy.visit(`/${TEST_DOMAIN}/test/dns-service/zones`)
    cy.contains("[data-test=page-title]", "DNS")
    cy.contains("Request New Zone").click()
    cy.contains("Request New Domain")
    cy.contains("button", "Cancel").click()
  })

  it("open dns page and test Request New Zone with Internal SAP Hosted Zone", () => {
    cy.visit(`/${TEST_DOMAIN}/test/dns-service/zones`)
    cy.contains("[data-test=page-title]", "DNS")
    cy.contains("Request New Zone").click()
    cy.contains("Request New Domain")
    cy.get("#zone_request_domain_pool").select("Internal SAP Hosted Zone")
    // click Custom Domain
    cy.get("input#zone_request_domain_type_rootdomain").should("be.visible").click()
    cy.get("input#zone_request_name").should("be.visible")
    cy.contains("ns2.qa-de-1.cloud.sap").should("be.visible")

    cy.contains("button", "Cancel").click()
  })
})
