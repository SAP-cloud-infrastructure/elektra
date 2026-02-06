describe("instances", () => {
  beforeEach(() => {
    cy.elektraLogin(Cypress.env("TEST_DOMAIN"), Cypress.env("TEST_USER"), Cypress.env("TEST_PASSWORD"))
  })

  it("in test project the instances page is reachable and you can search for VM with title 'elektra-test-vm' and show it's details", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/compute/instances`)
    cy.contains("[data-test=page-title]", "Servers")
    cy.get("#search").should("be.visible").type("elektra{enter}")

    cy.contains("elektra-test-vm").click()
    cy.contains("h4", "Show Instance")
    cy.contains("td", "elektra-test-vm (do not delete)")
  })

  it("click on 'Create New' button in test project opens a modal window and check form", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/test/compute/instances`)
    cy.contains("[data-test=page-title]", "Servers")

    cy.contains("Create New")
    cy.get(".btn").contains("Create New").click()
    cy.url().should("include", "instances?overlay=new")
    cy.get("button.btn.btn-primary").contains("Create").click()
    cy.contains("li", "Name: Please provide a name")
    cy.contains("li", "Image_id: Please select an image")
    cy.contains("li", "Flavor_id: Please select a flavor")
    cy.contains("li", "Network_ids: Please select a network")
  })

  it("in test project the dropdown menu for 'elektra-test-vm' is available and menus are working", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/compute/instances?searchfor=Name&search=elektra`)
    cy.contains("[data-test=page-title]", "Servers")

    cy.get("button.dropdown-toggle").click()
    cy.contains("a", "Edit")
      .should("be.visible")
      .then(($menu) => {
        cy.wrap($menu).click()
      })
    cy.contains("label", "Name")
    cy.contains("button", "Cancel").click()

    cy.get("button.dropdown-toggle").click()
    cy.contains("a", "Attach Floating IP")
      .should("be.visible")
      .then(($menu) => {
        cy.wrap($menu).click()
      })
    cy.contains("h4", "Attach Floating IP")
    cy.contains("button", "Cancel").click()

    cy.get("button.dropdown-toggle").click()
    cy.contains("a", "Detach Floating IP")
      .should("be.visible")
      .then(($menu) => {
        cy.wrap($menu).click()
      })
    cy.contains("label", "Address")
    cy.contains("button", "Cancel").click()

    cy.get("button.dropdown-toggle").click()
    cy.contains("a", "Attach Interface")
      .should("be.visible")
      .then(($menu) => {
        cy.wrap($menu).click()
      })
    cy.contains("label", "Network")
    cy.contains("button", "Cancel").click()

    cy.get("button.dropdown-toggle").click()
    cy.contains("a", "Detach Interface")
      .should("be.visible")
      .then(($menu) => {
        cy.wrap($menu).click()
      })
    cy.contains("label", "Address")
    cy.contains("button", "Cancel").click()

    cy.get("button.dropdown-toggle").click()
    cy.contains("a", "Resize")
      .should("be.visible")
      .then(($menu) => {
        cy.wrap($menu).click()
      })
    cy.contains("label", "Old flavor")
    cy.contains("button", "Cancel").click()

    cy.get("button.dropdown-toggle").click()
    cy.contains("a", "Create Snapshot")
      .should("be.visible")
      .then(($menu) => {
        cy.wrap($menu).click()
      })
    cy.contains("you need the image_admin and objectstore_admin role")
    cy.get('#mainModal button[type="button"]').click()
  })

  it("in test project rename 'elektra-test-vm' and show it's details", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/compute/instances?searchfor=Name&search=elektra`)
    cy.contains("[data-test=page-title]", "Servers")

    cy.get("button.dropdown-toggle").click()
    cy.contains("a", "Edit")
      .should("be.visible")
      .then(($menu) => {
        cy.wrap($menu).click()
      })
    cy.contains("label", "Name")
    let currenDate = Date.now()
    cy.get("input#server_name").type(
      `{selectall}elektra-test-vm (do not delete) added by e2e test ${currenDate}{enter}`
    )
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/compute/instances?searchfor=Name&search=elektra`)
    cy.contains("elektra-test-vm").click()
    cy.contains(`added by e2e test ${currenDate}`)
  })
})
