const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("security_groups", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open security groups and new new security group button available", () => {
    cy.visit(`/${TEST_DOMAIN}/test/networking/widget/security-groups/?r=`)
    cy.contains("[data-test=page-title]", "Security Groups")
    cy.contains("a", "New Security Group").should("not.exist")
  })

  it("open security groups and check default group", () => {
    cy.visit(`/${TEST_DOMAIN}/test/networking/widget/security-groups/?r=`)
    cy.contains("[data-test=page-title]", "Security Groups")
    cy.contains("a", "default").click()
    cy.contains("Default security group")
    cy.contains("a", "Add New Rule").should("not.exist")
  })
})
