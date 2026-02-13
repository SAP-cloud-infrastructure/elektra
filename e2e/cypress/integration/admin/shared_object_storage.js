const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("shared object storage", () => {
  beforeEach(() => {
    cy.elektraLoginWithEnv()
  })

  it("open object storage and check create container button", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/object-storage/swift/`)
    cy.contains("[data-test=page-title]", "Object Storage")
    cy.contains("a", "Create container").click()
    cy.contains(
      "Inside a project, objects are stored in containers. Containers are where you define access permissions and quotas."
    )
    cy.contains("button", "Cancel").click()
  })

  it("open object storage and check capabilities dialog", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/object-storage/swift/`)
    cy.contains("[data-test=page-title]", "Object Storage")
    cy.get("i.fa-info-circle").click()
    cy.contains("Capabilities")
  })

  it("check with deep link the container access control dialog and check ACLs button for elektra-test container", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/object-storage/swift/containers/elektra-test/access-control`)
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(3000)
    // need to wait until loading is done otherwise it is not possible to access the check acls button and will end
    // with a time out because element is detached from the DOM -> see below comment
    cy.contains("Read ACLs")
    cy.get('input[name="public_read_access"]').click()
    cy.contains("button", "Check ACLs").click()
    // TODO: Timed out retrying after 20050ms: `cy.click()` failed because this element is detached from the DOM.
    //       it I use the deep link the view is loading with interruption
    //cy.get(".modal-body > .row > .col-md-6 > .loading-place > button").click()
    cy.contains("valid token required: false")
  })

  it("check with deep link container properties for elektra-test and test edit metadata", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/object-storage/swift/containers/elektra-test/properties`)
    cy.get('[data-test="metaDataKey_0"]').type("{selectAll}footestkey")
    cy.get('[data-test="metaDataValue_0"]').type("{selectAll}footestvalue")
    cy.get('[data-test="Update container"]').click()

    // reload view to check that tags are written
    cy.visit(`/${TEST_DOMAIN}/admin/object-storage/swift/containers/elektra-test/properties`)
    // check value and delete
    cy.get('[data-test="metaDataValue_0"]').should("have.value", "footestvalue").type("{selectAll}{backspace}")
    cy.get('[data-test="metaDataKey_0"]').should("have.value", "footestkey").type("{selectAll}{backspace}")
    cy.get('[data-test="Update container"]').click()
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000) // this is only for cosmetic reason to see that the window was closed in the video
  })

  it("open object storage and elektra-test container and check action buttons", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/object-storage/swift/`)
    cy.contains("[data-test=page-title]", "Object Storage")
    cy.contains("a", "elektra-test").click()
    cy.contains("a", "Create folder").click()
    cy.contains("Type container name")
    cy.contains("button", "Cancel").click()
    cy.contains("a", "Upload file").click()
    cy.contains("Upload file to /elektra-test/")
    cy.contains("button", "Cancel").click()
  })

  it("check with deep link object properties for amiga.jpg and test edit metadata", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/object-storage/swift/containers/elektra-test/objects/X18kPQ%3D%3D/amiga.jpg/show`)
    cy.get('[data-test="metaDataKey_0"]').type("{selectAll}footestkey")
    cy.get('[data-test="metaDataValue_0"]').type("{selectAll}footestvalue")
    cy.get('[data-test="Update object"]').click()

    // reload view to check that tags are written
    cy.visit(`/${TEST_DOMAIN}/admin/object-storage/swift/containers/elektra-test/objects/X18kPQ%3D%3D/amiga.jpg/show`)
    // check value and delete
    cy.get('[data-test="metaDataValue_0"]').should("have.value", "footestvalue").type("{selectAll}{backspace}")
    cy.get('[data-test="metaDataKey_0"]').should("have.value", "footestkey").type("{selectAll}{backspace}")
    cy.get('[data-test="Update object"]').click()
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000) // this is only for cosmetic reason to see that the window was closed in the video
  })

  it("open elektra-test container directly with deep link and check item copy dialog", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/object-storage/swift/containers/elektra-test/objects/X18kPQ%3D%3D/amiga.jpg/copy`)
    cy.contains("Target container")
    cy.contains("Target path")
    cy.contains("button", "Cancel").click()
  })

  it("open elektra-test container directly with deep link and check item move dialog", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/object-storage/swift/containers/elektra-test/objects/X18kPQ%3D%3D/amiga.jpg/move`)
    cy.contains("Target container")
    cy.contains("Target path")
    cy.contains("button", "Cancel").click()
  })

  it("check with deep link the empty container dialog that is not empty", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/object-storage/swift/containers/elektra-test/empty`)
    cy.contains("button", "Empty").should("be.disabled")
    cy.contains("Are you sure? All objects in the container will be deleted. This cannot be undone.")
    cy.get("i.fa.fa-clone").click()
    cy.get('input[name="confirmation"]').should("have.value", "elektra-test")
    cy.contains("button", "Empty").should("be.enabled")
    cy.contains("button", "Cancel").click()
  })

  it("check with deep link the empty container dialog that is empty", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/object-storage/swift/containers/elektra-test-empty/empty`)
    cy.contains("Nothing to do. Container is already empty.").click()
  })

  it("check with deep link the delete container dialog that is not empty", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/object-storage/swift/containers/elektra-test/delete`)
    cy.contains("Cannot delete Container contains objects. Please empty it first.")
    cy.contains("button", "Got it!").click()
  })

  it("check with deep link the delete container dialog that is empty", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/object-storage/swift/containers/elektra-test-empty/delete`)
    cy.contains("button", "Delete").should("be.disabled")
    cy.contains("Are you sure? The container will be deleted. This cannot be undone.")
    cy.get("i.fa.fa-clone").click()
    cy.get('input[name="confirmation"]').should("have.value", "elektra-test-empty")
    cy.contains("button", "Delete").should("be.enabled")
    cy.contains("button", "Cancel").click()
  })

  it("open object storage and elektra-test container and check download big files dialog", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/object-storage/swift/`)
    cy.contains("[data-test=page-title]", "Object Storage")
    cy.contains("a", "elektra-test").click()
    // force: true prevents this error:
    // "This DOM element likely became detached somewhere between the previous and current command."
    cy.contains("a", "big file").click({ force: true })
    cy.contains("Instructions for downloading large file")
  })

  // this is not working because popper is not rendering correctly
  // it("open object storage and search elektra-test to test dialogs", () => {
  //   cy.visit(`/${TEST_DOMAIN}/admin/object-storage/swift/`)
  //   cy.get('[data-test="search"]').type("elektra-test-empty")
  //   cy.get('[data-test="dropdown"]').click()
  //   cy.contains("a", "Empty").click()
  // })
})
