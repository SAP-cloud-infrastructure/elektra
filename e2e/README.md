Please Note, the Test User,Domain and Project is only configured in QA-DE-1

## Smoke Tests (No Authentication Required)

You can run smoke tests without any test user configuration. These tests verify:

- System health endpoints (liveliness, readiness, startprobe)
- Landing page renders correctly
- All plugin routes are mounted (not 404)
- Login page renders correctly

```bash
# Run smoke tests against any Elektra instance
./run.sh --profile smoke --host http://localhost:3000

# Mac users
./run.sh --profile smoke --host http://host.docker.internal:3000
```

Smoke tests are useful for:

- Verifying deployments without test credentials
- Quick health checks in CI/CD pipelines
- Testing against any environment (not just QA-DE-1)

# Best Practice

https://docs.cypress.io/guides/references/best-practices

- write descriptions always in lowercase

# Usage

```bash
./run.sh --help
```

## run e2e tests against elektra running on remote host

```bash
./run.sh https://elektra.corp
```

## run e2e in workspaces with running elektra env localhost

```bash
./run.sh
```

run.sh will find out all information

## run e2e with debug mode

```bash
  run.sh --host http://localhost:3000 --debug 'cypress:network:*'
  # will show debug information about the networking"
```

Debugging options: https://docs.cypress.io/guides/references/troubleshooting#Log-sources"

- `cypress:cli` The top-level command line parsing problems
- `cypress:server:args` Incorrect parsed command line arguments
- `cypress:server:specs` Not finding the expected specs
- `cypress:server:project` Opening the project
- `cypress:server:browsers` Finding installed browsers
- `cypress:launcher` Launching the found browser
- `cypress:server:video` Video recording
- `cypress:network:*` Adding network interceptors
- `cypress:net-stubbing*` Network interception in the proxy layer
- `cypress:server:reporter` Problems with test reporters
- `cypress:server:preprocessor` Processing specs
- `cypress:server:plugins` Running the plugins file and bundling specs
- `cypress:server:socket-e2e` Watching spec files
- `cypress:server:task` Invoking the cy.task() command
- `cypress:server:socket-base` Debugging cy.request() command
- `cypress:server:fixture` Loading fixture files
- `cypress:server:record:ci-info` Git commit and CI information when recording to the Cypress Dashboard

## run e2e from darwin running elektra locally on port 3000

```bash
./run.sh --host http://host.docker.internal:3000
```

## env

you need to add the following env vars to your `.env`

```
TEST_DOMAIN="cc3test"
TEST_MEMBER_USER="TEST_D021500_TM"
TEST_MEMBER_PASSWORD="xxx"
TEST_ADMIN_USER="TEST_D021500_TA"
TEST_ADMIN_PASSWORD="xxd"
```

for password check `secrets/qa-de-1/values/domain-seeds.yaml`

## cypress.json

- https://docs.cypress.io/guides/references/configuration#Global

# Tips

- `cy.get().should('be.disabled')` works not with `a` or `div` tag instead use

```
  cy.get().should('have.attr', 'disabled');
  cy.get().should('not.have.attr', 'disabled');
```

- if you do not find a good identifier use data attribute like `data-test="search"` you can access it in cypress with `cy.get('[data-test=search]`')

# TODOs

- at the moment we cannot test keppel-ui and cloudops tools, because our test admin user has no permission
- we need our own project with a test member and admin user
- https://documentation.global.cloud.sap/docs/customer/access-management/identity-service/overview/identity-usage/#technical-users
