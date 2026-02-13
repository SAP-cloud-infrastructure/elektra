const TEST_DOMAIN = Cypress.expose("TEST_DOMAIN")

describe("keymanager", () => {
  let randomNum
  let secretName
  let secretPayload

  const createSecret = (name, type, contentType, payload) => {
    cy.contains("New Secret").click()
    cy.get("[data-target='name-text-input']").type(name)
    cy.get("[data-target='secret-type-select']").click()
    cy.get(`[data-target='secret-type-select-option-${type}']`).click({ force: true })
    cy.get("[data-target='payload-text-area']").type(payload)
    cy.get("[data-target='payload-content-type-select']").click()
    cy.get(`[data-target='payload-content-type-select-option-${contentType}']`).click({ force: true })
    cy.contains("Save").click({ force: true })
    cy.get(`[data-target=${name}]`).should("exist")
  }

  const deleteSecret = (name) => {
    cy.get(`[data-target=${name}]`)
      .find("[data-target='secret-uuid']")
      .invoke("text")
      .then((uuid) => {
        cy.get(`[data-target=${uuid}]`).click()
        cy.contains("Remove").click()
        cy.contains(`The secret ${uuid} is successfully deleted.`).should("exist")
      })
  }

  beforeEach(() => {
    cy.elektraLoginWithEnv()
    randomNum = Cypress._.random(0, 1e6)
    secretName = `test-pass-phrase-secret-${randomNum}`
    secretPayload = "test secret"
  })

  it("create and delete a 'Passphrase' secret", () => {
    cy.visit(`/${TEST_DOMAIN}/admin/keymanager/secrets`)

    // Verify validation errors
    cy.contains("New Secret").click()
    cy.contains("Save").click()
    cy.contains("Name can't be empty!")
    cy.contains("Secret type can't be empty!")
    cy.contains("Payload can't be empty!")
    cy.contains("Payload content type can't be empty!")

    // Create secret
    cy.get("[data-target='name-text-input']").type(secretName)
    cy.get("[data-target='secret-type-select']").click()
    cy.get("[data-target='secret-type-select-option-passphrase']").click({ force: true })
    cy.get("[data-target='payload-text-area']").type(secretPayload)
    cy.get("[data-target='payload-content-type-select']").click()
    cy.get("[data-target='payload-content-type-select-option-text/plain']").click({ force: true })
    cy.contains("Save").click()

    // Verify and delete
    cy.get(`[data-target=${secretName}]`).should("exist")
    deleteSecret(secretName)
  })
})
