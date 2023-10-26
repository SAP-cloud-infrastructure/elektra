describe("keymanagerng", () => {
  let randomNumber
  let createSecret
  let deleteSecret
  let deleteContainer
  let iRandomNum
  let sPassPhraseSecretName
  let sPrivateSecretName
  let sPublicSecretName
  let sCertificateSecretName
  let sSymmetricSecretName
  let sSecretPayload
  let sSecretUuid
  let sContainerUuid
  let sGenericContainerName
  let sCertificateContainerName
  let sRsaContainerName

  before(() => {
    createSecret = (sSecretName, iSecretType, iPayloadContentType) => {
      cy.contains("New Secret").click()
      cy.get("[data-target='name-text-input']").type(sSecretName)
      //Select Secret Type
      cy.get("select[name='secretType']").select(iSecretType, { force: true })
      cy.get("[data-target='payload-text-area']").type(sSecretPayload)
      cy.get("select[name='payloadContentType']").select(iPayloadContentType, {
        force: true,
      })
      //Save the new secret
      cy.contains("Save").click({ force: true })

      //Find the newly created secret in secrets table
      cy.get("[data-target=" + sSecretName + "]").should("have.lengthOf", 1)
    }

    deleteSecret = (sSecretName) => {
      cy.get("[data-target=" + sSecretName + "]")
        .find("[data-target='secret-uuid']")
        .then(($identifier) => {
          sSecretUuid = $identifier[0].innerText
          cy.get("[data-target=" + sSecretUuid + "]").click()
          cy.contains("Remove").should("have.lengthOf", 1)
          cy.contains("Cancel").should("have.lengthOf", 1)
          cy.contains(
            "Are you sure you want to delete the secret " + sSecretName + "?"
          ).click()
          cy.contains("Remove").click()
          cy.contains(
            "The secret " + sSecretUuid + " is successfully deleted."
          ).should("have.lengthOf", 1)
        })
    }
    deleteContainer = (sContainerName) => {
      cy.get("[data-target=" + sContainerName + "]")
        .find("[data-target='container-uuid']")
        .then(($identifier) => {
          sContainerUuid = $identifier[0].innerText
          cy.get("[data-target=" + sContainerUuid + "]").click()
          cy.contains("Remove").should("have.lengthOf", 1)
          cy.contains("Cancel").should("have.lengthOf", 1)
          cy.contains(
            "Are you sure you want to delete the container " +
              sContainerName +
              "?"
          ).click()
          cy.contains("Remove").click()
          cy.contains(
            "The container " + sContainerUuid + " is successfully deleted."
          ).should("have.lengthOf", 1)
        })
    }
  })

  beforeEach(() => {
    cy.elektraLogin(
      Cypress.env("TEST_DOMAIN"),
      Cypress.env("TEST_USER"),
      Cypress.env("TEST_PASSWORD")
    )
    randomNumber = () => Cypress._.random(0, 1e6)
    iRandomNum = randomNumber()
    sPassPhraseSecretName = `test-pass-phrase-secret-${iRandomNum}`
    sPrivateSecretName = `test-private-secret-${iRandomNum}`
    sPublicSecretName = `test-public-secret-${iRandomNum}`
    sCertificateSecretName = `test-certificate-secret-${iRandomNum}`
    sSymmetricSecretName = `test-symmetric-secret-${iRandomNum}`
    sSecretPayload = `test secret`
    sGenericContainerName = `test-generic-container-${iRandomNum}`
    sCertificateContainerName = `test-certificate-container-${iRandomNum}`
    sRsaContainerName = `test-rsa-container-${iRandomNum}`
  })

  it("open key manager and create a new 'Passphrase' secret and delete it", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/keymanagerng/secrets`)

    //Check domain and project names and titles
    cy.contains("cc3test").should("have.lengthOf", 1)
    cy.contains("admin").should("have.lengthOf", 1)
    cy.contains("Key Manager").should("have.lengthOf", 1)
    cy.contains("Secrets").should("have.lengthOf", 1)
    cy.contains(
      "This is the new version of Key Manager. If you prefer to use the previous version, click here"
    ).should("have.lengthOf", 1)

    //navigate to old key manager
    cy.get("[data-target='nav-to-old-key-manager']").click()
    cy.contains("There is a new version of Key Manager. Try it out").should(
      "have.lengthOf",
      1
    )
    //navigate back to the new key manager
    cy.get("[data-target='nav-to-new-key-manager']").click()
    cy.contains(
      "This is the new version of Key Manager. If you prefer to use the previous version, click here"
    ).should("have.lengthOf", 1)

    //Trying to create a new secret without filling name or payload inputs
    cy.contains("New Secret").click()
    cy.contains("New Secret").should("have.lengthOf", 1)
    cy.contains("Save").click()
    cy.contains("Name can't be empty!")
    cy.contains("Secret type can't be empty!")
    cy.contains("Payload can't be empty!")
    cy.contains("Payload content type can't be empty!")

    //Fill necessary fields to create a new secret
    cy.get("[data-target='name-text-input']").type(sPassPhraseSecretName)
    cy.get("select[name='secretType']").select(3, { force: true })
    cy.get("[data-target='payload-text-area']").type(sSecretPayload)
    cy.get("select[name='payloadContentType']").select(1, {
      force: true,
    })
    cy.contains("Save").click()

    //Find the newly created secret in secrets table
    cy.get("[data-target=" + sPassPhraseSecretName + "]").should(
      "have.lengthOf",
      1
    )

    //Delete the newly created secret
    deleteSecret(sPassPhraseSecretName)
  })

  /*it("Create a new 'Symmetric' secret, check 'Payload Content Encoding' is available, then delete the newly created secret", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/keymanagerng/secrets`)

    //Create a new secret with symmetric type
    createSecret(sSymmetricSecretName, 6, 1)

    //Delete the newly created secret
    deleteSecret(sSymmetricSecretName)
  })*/

  it("Create new containers with 'Generic' and 'Certificate' container types and delete them afterwards", () => {
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/keymanagerng/secrets`)

    //1. Create a new container with container type 'Generic' and delete it afterwards
    //Create one Passphrase secret to be selected in the new container
    createSecret(sPassPhraseSecretName, 3, 1)

    //Select Containers
    cy.contains("Containers").click()

    //Create a new container
    cy.contains("New Container").click()
    cy.contains("New Container").should("have.lengthOf", 1)

    //Check that creating a new container without giving it a name is not possible
    cy.contains("Save").click()
    cy.contains("Name can't be empty!")
    cy.contains("Secrets can't be empty!")

    //Fill out name of the new container
    cy.get("[data-target='container-name-text-input']").type(
      sGenericContainerName
    )

    //Select a secret to add it to the new container
    cy.contains("Select...").click({ force: true })
    cy.contains("Select...").click({ force: true })
    cy.contains(sPassPhraseSecretName + " (passphrase)").should(
      "have.lengthOf",
      1
    )

    cy.get(".select__control") // find react-select component
      .get(".select__menu") // find opened dropdown
      .get(".select__menu-list")
      .find(".select__option") // find all options
      .contains(sPassPhraseSecretName + " (passphrase)")
      .click()

    // Create the new container
    cy.contains("Save").click()
    cy.get("[data-target=" + sGenericContainerName + "]").should(
      "have.lengthOf",
      1
    )
    //Find the newly created container to delete it
    deleteContainer(sGenericContainerName)

    //2. Create a new container with container type 'Certificate' and delete it afterwards
    cy.contains("Secrets").click()

    // deleteSecret(sPassPhraseSecretName)
    //Create one Certificate secret to be selected in the new container
    createSecret(sCertificateSecretName, 1, 1)

    //Select Containers and create a container
    cy.contains("Containers").click()
    cy.contains("New Container").click()
    cy.contains("New Container").should("have.lengthOf", 1)

    //Fill out name of the new container
    cy.get("[data-target='container-name-text-input']").type(
      sCertificateContainerName
    )
    //Select 'Certificate' as the container type
    cy.get("select[name='containerType']").select("certificate", {
      force: true,
    })

    //Select a certificate secret to add it to the new container
    cy.get("select[name='cert_container_type_certificates']").select(
      sCertificateSecretName + " (certificate)",
      {
        force: true,
      }
    )

    cy.contains(sCertificateSecretName + " (certificate)").should(
      "have.lengthOf",
      1
    )

    // Create the new container
    cy.contains("Save").click()
    cy.get("[data-target=" + sCertificateContainerName + "]").should(
      "have.lengthOf",
      1
    )
    //Find the newly created container to delete it
    deleteContainer(sCertificateContainerName)

    //Select Secrets
    cy.contains("Secrets").click()

    //Delete the newly created secrets
    deleteSecret(sCertificateSecretName)

    // Click on containers and again come back to secrets because performing
    // deletion on two secrets following by each other could not successful
    cy.contains("Containers").click()
    cy.contains("Secrets").click()

    deleteSecret(sPassPhraseSecretName)
  })

  it("Create new containers with 'Rsa' container type and delete it afterwards", () => {
    //Create a new container with container type 'Rsa' and delete it afterwards
    cy.visit(`/${Cypress.env("TEST_DOMAIN")}/admin/keymanagerng/secrets`)

    //Create three secrets with types passphrase, public and private to be selected in the new container
    //1. Create passphrase secret
    createSecret(sPassPhraseSecretName, 3, 1)

    //2. Create private secret
    createSecret(sPrivateSecretName, 4, 1)

    //3. Create public secret
    createSecret(sPublicSecretName, 5, 1)

    //Select Containers
    cy.contains("Containers").click()

    //Create a new container with container type 'Rsa' and delete it afterwards
    cy.contains("New Container").click()
    cy.contains("New Container").should("have.lengthOf", 1)
    //Fill out name of the new container
    cy.get("[data-target='container-name-text-input']").type(sRsaContainerName)
    //Select 'Certificate' as the container type
    cy.get("select[name='containerType']").select("rsa", {
      force: true,
    })

    //Select a certificate secret to add it to the new container
    cy.get("select[name='rsa_container_type_private_keys']").select(
      sPrivateSecretName + " (private)",
      {
        force: true,
      }
    )

    cy.contains(sPrivateSecretName + " (private)").should("have.lengthOf", 1)

    // Create the new container
    cy.contains("Save").click()
    cy.contains("Private key passphrases can't be empty!")
    cy.contains("Public keys can't be empty!")

    //Select a certificate secret to add it to the new container
    cy.get("select[name='rsa_container_type_private_key_passphrases']").select(
      sPassPhraseSecretName + " (passphrase)",
      {
        force: true,
      }
    )

    cy.contains(sPassPhraseSecretName + " (passphrase)").should(
      "have.lengthOf",
      1
    )

    // Create the new container
    cy.contains("Save").click()
    cy.contains("Public keys can't be empty!")

    //Select a certificate secret to add it to the new container
    cy.get("select[name='rsa_container_type_public_keys']").select(
      sPublicSecretName + " (public)",
      {
        force: true,
      }
    )

    cy.contains(sPublicSecretName + " (public)").should("have.lengthOf", 1)

    // Create the new container
    cy.contains("Save").click()
    cy.get("[data-target=" + sRsaContainerName + "]").should("have.lengthOf", 1)

    // Find the newly created container to delete it
    deleteContainer(sRsaContainerName)

    //Select Secrets
    cy.contains("Secrets").click()

    //Delete the newly created secrets
    deleteSecret(sPassPhraseSecretName)

    //Click on containers and again come back to secrets
    cy.contains("Containers").click()
    cy.contains("Secrets").click()

    // Delete the newly created public secret
    deleteSecret(sPublicSecretName)

    //Click on containers and again come back to secrets
    cy.contains("Containers").click()
    cy.contains("Secrets").click()

    // Delete the newly created private secret
    deleteSecret(sPrivateSecretName)
  })

  after(() => {
    deleteSecret = null
    deleteContainer = null
    createSecret = null
  })

  afterEach(() => {
    randomNumber = null
    iRandomNum = null
    sPassPhraseSecretName = null
    sPrivateSecretName = null
    sPublicSecretName = null
    sCertificateSecretName = null
    sSecretPayload = null
    sSecretUuid = null
    sContainerUuid = null
    sGenericContainerName = null
    sCertificateContainerName = null
    sRsaContainerName = null
    sSymmetricSecretName = null
  })
})
