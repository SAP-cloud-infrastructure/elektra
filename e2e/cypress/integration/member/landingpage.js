describe("landing page", () => {
  it("loads content", () => {
    // content is loaded if children of root element exists.
    // children are built by React
    cy.request("/").should((response) => {
      expect(response.status).to.eq(200)
    })
  })

  it("user is not logged, tries to visit domain", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}`)
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500)
    cy.contains("button", "Log in")
  })

  describe("Content", () => {
    before(() => {
      cy.visit("/")
    })

    it("contains Converged Cloud", () => {
      cy.get('[id="root"]').get('[data-shadow-host="true"]').shadow().contains("Converged Cloud")
    })
  })
})
