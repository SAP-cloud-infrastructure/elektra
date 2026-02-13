// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

/**
 * Custom command to perform login using credentials from environment.
 * Uses cy.env() to securely access TEST_USER and TEST_PASSWORD.
 * Uses Cypress.expose() to access TEST_DOMAIN (public configuration).
 *
 * @example
 * // Login with environment credentials
 * cy.elektraLoginWithEnv()
 *
 * // Login with custom domain but env credentials
 * cy.elektraLoginWithEnv({ domain: 'customdomain' })
 */
Cypress.Commands.add("elektraLoginWithEnv", (options = {}) => {
  const domain = options.domain || Cypress.expose("TEST_DOMAIN")

  cy.env(["TEST_USER", "TEST_PASSWORD"]).then(({ TEST_USER, TEST_PASSWORD }) => {
    cy.elektraLogin(domain, TEST_USER, TEST_PASSWORD)
  })
})

/**
 * Custom command to perform login with explicit credentials.
 *
 * @param {string} domain - The domain to login to
 * @param {string} user - The username
 * @param {string} password - The password
 */
Cypress.Commands.add("elektraLogin", (domain, user, password) => {
  cy.visit(`/${domain}/auth/login/${domain}`)
  cy.get("#username").type(user)
  cy.get("#password").type(password, { log: false })
  cy.get('button[type="submit"]').click()

  // accept terms of use if not already accepted
  // to test you need to delete the tos entry in the DB
  // logon to rails console with "bin/rails c"
  // get the user you want with "UserProfile.first.domain_profiles"
  // delete the profile with "UserProfile.second.domain_profiles.delete_all"
  cy.get("body").then(($body) => {
    // return if login failed
    if ($body.html().indexOf("Invalid username/password combination.") >= 0) return

    // go to domain home page
    cy.visit(`/${domain}/home`)
    // check if body contains terms of use content
    cy.get("body").then(($body) => {
      if ($body.find("input#accept_tos").length > 0) {
        // accept
        cy.get("input#accept_tos").check()
        cy.get("input").contains("Accept").click()
      }
    })
  })
})
