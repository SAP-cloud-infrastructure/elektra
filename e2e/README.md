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
- `cypress:webpack` Bundling specs using webpack
- `cypress:server:fixture` Loading fixture files
- `cypress:server:record:ci-info` Git commit and CI information when recording to the Cypress Dashboard

## run e2e from darwin running elektra locally on port 3000

```bash
./run.sh --host http://host.docker.internal:3000
```
