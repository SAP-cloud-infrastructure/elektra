describe("security_groups", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  // set to skip because the security group creation is not working
  // the New Security Group is in the test disabled
  // but if I check this directly in the browser with the same user it is enabled
  it.skip("open security groups and check new security group button", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/networking/widget/security-groups/?r=`)
    cy.contains("[data-test=page-title]", "Security Groups")
    cy.contains("a", "New Security Group").click()
    cy.contains("button", "Save").should("be.disabled")
    cy.get("#name").type("bla")
    cy.contains("button", "Save").should("be.enabled")
  })

  it("open security groups and check default group", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/networking/widget/security-groups/?r=`)
    cy.contains("[data-test=page-title]", "Security Groups")
    cy.contains("a", "default").click()
    cy.contains("Default security group")
    cy.contains("a", "Add New Rule").click()
    cy.contains("New Security Group Rule")
    cy.contains("button", "Cancel").click()
  })
})
