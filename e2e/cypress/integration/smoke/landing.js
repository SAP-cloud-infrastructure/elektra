/**
 * Landing Page Tests
 *
 * These tests verify that the landing page and public-facing pages
 * are loading correctly. No authentication is required.
 */
describe("landing page", () => {
  describe("root page", () => {
    it("loads and renders react app", () => {
      cy.visit("/")
      // React app should render content inside shadow DOM
      cy.get('[id="root"]').get('[data-shadow-host="true"]').shadow().contains("SAP Cloud Infrastructure")
    })

    it("has a login button", () => {
      cy.visit("/")
      cy.get('[id="root"]').get('[data-shadow-host="true"]').shadow().find("button").should("exist")
    })
  })

  describe("domain access without auth", () => {
    it("shows login button when visiting domain without auth", () => {
      cy.visit(`/${Cypress.env("TEST_DOMAIN") || "cc3test"}`)
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500)
      cy.contains("button", "Log in")
    })

    it("redirects to login when visiting domain home without auth", () => {
      cy.visit(`/${Cypress.env("TEST_DOMAIN") || "cc3test"}/home/`)
      cy.contains("Please sign in")
    })
  })

  describe("error handling", () => {
    it("shows unsupported domain error for invalid domain", () => {
      cy.visit("/BAD_DOMAIN_THAT_DOES_NOT_EXIST/home", { failOnStatusCode: false })
      cy.contains("Unsupported Domain")
    })
  })
})
