const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("landing page", () => {
  it("loads content", () => {
    // content is loaded if children of root element exists.
    // children are built by React
    cy.request("/").should((response) => {
      expect(response.status).to.eq(200)
    })
  })

  it("user is not logged, tries to visit domain", () => {
    cy.visit(`/${TEST_DOMAIN}`)
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500)
    cy.contains("button", "Log in")
  })

  describe("Content", () => {
    before(() => {
      cy.visit("/")
    })

    it("contains SAP Cloud Infrastructure", () => {
      cy.get('[id="root"]').get('[data-shadow-host="true"]').shadow().contains("SAP Cloud Infrastructure")
    })
  })
})
