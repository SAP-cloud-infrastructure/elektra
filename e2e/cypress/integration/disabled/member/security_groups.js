describe("security_groups", () => {
  beforeEach(() => {
    cy.elektraLogin(
      Cypress.env("TEST_DOMAIN"),
      Cypress.env("TEST_USER"),
      Cypress.env("TEST_PASSWORD")
    )
  })

  it("open security groups and new new security group button available", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/networking/widget/security-groups/?r=`)
    cy.contains('[data-test=page-title]','Security Groups')
    cy.contains('a','New Security Group').should('not.exist')
  })

  it("open security groups and check default group", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/networking/widget/security-groups/?r=`)
    cy.contains('[data-test=page-title]','Security Groups')
    cy.contains('a','default').click()
    cy.contains('Default security group')
    cy.contains('a','Add New Rule').should('not.exist')
  })

})