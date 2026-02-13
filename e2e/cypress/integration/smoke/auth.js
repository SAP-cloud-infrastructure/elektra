/**
 * Authentication Page Tests
 *
 * These tests verify that the authentication pages render correctly.
 * No actual login is performed - we only test the UI elements.
 */

const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN") || "cc3test"

describe("authentication pages", () => {
  describe("login page", () => {
    beforeEach(() => {
      cy.visit(`/${TEST_DOMAIN}/auth/login/${TEST_DOMAIN}`)
    })

    it("renders login form", () => {
      cy.get("#username").should("exist").and("be.visible")
      cy.get("#password").should("exist").and("be.visible")
      cy.get('button[type="submit"]').should("exist").and("be.visible")
    })

    it("has username and password input fields", () => {
      cy.get("#username").should("have.attr", "type", "text")
      cy.get("#password").should("have.attr", "type", "password")
    })

    it("submit button is enabled", () => {
      cy.get('button[type="submit"]').should("not.be.disabled")
    })
  })

  describe("login validation", () => {
    it("shows error for invalid credentials", () => {
      cy.visit(`/${TEST_DOMAIN}/auth/login/${TEST_DOMAIN}`)
      cy.get("#username").type("INVALID_USER_THAT_DOES_NOT_EXIST")
      cy.get("#password").type("INVALID_PASSWORD", { log: false })
      cy.get('button[type="submit"]').click()
      cy.contains("Invalid username/password combination.")
    })
  })

  describe("domain validation", () => {
    it("shows error for unsupported domain", () => {
      cy.visit("/BAD_DOMAIN_12345/home", { failOnStatusCode: false })
      cy.contains("Unsupported Domain")
    })

    it("login page handles non-existent domain gracefully", () => {
      cy.request({
        url: "/NON_EXISTENT_DOMAIN/auth/login/NON_EXISTENT_DOMAIN",
        failOnStatusCode: false,
      }).then((response) => {
        // Should not crash - either show error or redirect
        expect(response.status).to.be.oneOf([200, 302, 404])
      })
    })
  })
})
