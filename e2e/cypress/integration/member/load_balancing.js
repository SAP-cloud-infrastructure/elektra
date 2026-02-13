const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("load balancing", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("rails loads the plugin", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/lbaas2/?r=/loadbalancers`)
    cy.contains("[data-test=page-title]", "Load Balancers")
  })

  it("react can load the basics", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/lbaas2/?r=/loadbalancers`)
    // test the table is being loaded
    cy.get("[data-target='table-loadbalancers']").should("have.lengthOf", 1)
  })

  it("the test lb can be found", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/lbaas2/?r=/loadbalancers`)
    // search in input
    cy.get("input[data-test='search']").type("elektra_e2e_test_do_not_delete")
    // check if the table has the entry
    cy.contains("elektra_e2e_test_do_not_delete")
  })

  it("the the basic objects can be displayed", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/lbaas2/?r=/loadbalancers`)
    // search in input
    cy.get("input[data-test='search']").type("elektra_e2e_test_do_not_delete")
    // check if the table has the entry
    cy.contains("elektra_e2e_test_do_not_delete").click()
    // check listener is displayed
    cy.contains("test_liste") //the whole name is being by the UI shortened
    // test pool is displayed
    cy.contains("test_pool") //the whole name is being by the UI shortened
  })
})
