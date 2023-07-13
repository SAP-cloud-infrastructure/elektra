describe("dns", () => {
  beforeEach(() => {
    cy.elektraLogin(
      Cypress.env("TEST_DOMAIN"),
      Cypress.env("TEST_USER"),
      Cypress.env("TEST_PASSWORD")
    )
  })

  it("open dns page and test Request New Zone dialog", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/dns-service/zones`)
    cy.contains("[data-test=page-title]", "DNS")
    cy.contains("Request New Zone").click()
    cy.contains("Request New Domain")
    cy.contains("button", "Cancel").click()
  })

  it("open dns page and test Request New Zone with Internal SAP Hosted Zone", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/dns-service/zones`)
    cy.contains("[data-test=page-title]", "DNS")
    cy.contains("Request New Zone").click()
    cy.contains("Request New Domain")
    cy.get("#zone_request_domain_pool").select("Internal SAP Hosted Zone")
    // click Subdomain
    cy.get("input#zone_request_domain_type_subdomain")
      .should("be.visible")
      .click()
    cy.get("input#zone_request_name").should("be.visible")
    // click Custom Domain
    cy.get("input#zone_request_domain_type_rootdomain")
      .should("be.visible")
      .click()
    cy.get("input#zone_request_name").should("be.visible")
    cy.contains("ns2.qa-de-1.cloud.sap").should("be.visible")

    cy.contains("button", "Cancel").click()
  })

  // Internal SAP Hosted Zone on F5 is no longer available
  /*it("open dns page and test Request New Zone with Internal SAP Hosted Zone on F5", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/dns-service/zones`)
    cy.contains('[data-test=page-title]','DNS')
    cy.contains('Request New Zone').click()
    cy.contains('Request New Domain')
    cy.get('#zone_request_domain_pool').select('Internal SAP Hosted Zone on F5')
    cy.get('input#zone_request_name').should('be.visible')
    cy.contains('button','Cancel').click()
  })*/
})
