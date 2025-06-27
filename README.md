[![Build Status](https://travis-ci.org/sapcc/elektra.svg?branch=master)](https://travis-ci.org/sapcc/elektra)

# Elektra

![Elektra Landing Page](https://github.com/sapcc/documents/raw/master/screenshots/sapcc_elektra_landing_page.png)

Elektra is an opinionated Openstack Dashboard for Operators and Consumers of Openstack Services. Its goal is to make Openstack more accessible to end-users.

To that end Elektra provides web UIs that turn operator actions into user self-services.

**User self-services:**

- User onboarding
- Project creation and configuration
- Quota requests
- Authorizations and access control for projects and services
- Cost control

**We have UIs for the following Openstack core services**:

- Compute: servers, server images, server snapshots (Nova)
- Block storage: volumes, volume snapshots (Cinder)
- User and group roles assignments (Keystone)
- Secure key store (Barbican)
- Software-defined networks, routers, floating IPs, security groups (Neutron)
- Loadbalancing (Octavia LBaaS)
- DNS (Designate)
- Object storage (Swift)
- Shared file storage (Manila)

**Extended services:**

- SAP Automation as a Service
- SAP Hana as a Service
- SAP Kubernetes as a Service

**Project Landing Page:**

![Elektra Project Screen](https://github.com/sapcc/documents/raw/master/screenshots/sapcc_elektra_project_screen.png)

## Where does the name come from?

In Greek mythology Elektra, the bright or brilliant one, is the Goddess of Clouds with a silver lining.

# Installing and Running Elektra

## Creating a GITHUB_TOKEN for Packages like `@sapcc/limes-ui`

To use packages like `@sapcc/limes-ui`, a **GITHUB_TOKEN** is required. The following steps are necessary:

1. **Create a Personal Access Token (PAT)**
   1.1. Navigate to **Settings** > **Developer Settings** in your profile.  
   1.2. Under **Personal access tokens**, select **Tokens (classic)** and generate a new token.  
   1.3. Assign the permission **read:packages** to allow access to private packages.

2. **Configure the `.npmrc` File**
   2.1. Copy the `.npmrc.sample` file to `.npmrc`.  
   2.2. Replace `$GITHUB_TOKEN` with the generated token in the `.npmrc` file.  
   Alternatively, you can export the token in the terminal: `export GITHUB_TOKEN=your_token_here`
3. Store the Token in the Concourse Pipeline  
   3.1. Navigate to vault/concourse-secrets/global/elektra/.
   3.2. Replace the token content with the generated token.

## Steps to setup a local development environemnt

### MacOS

1.  Install **postgres** database (current version is 16.4).

    If other versions are running, stop the service:

    ```bash
    brew services stop postgresql@<version>
    ```

    Install the new version:

    ```bash
    brew install postgresql@16
    brew link postgresql@16
    ```

    Check the postgres version running:

    ```bash
    postgres --version
    ```

    Start the postgres service:

    ```bash
    brew services start postgresql@16
    ```

    Create a new user and database:

    ```bash
    createuser -s postgres
    ```

    Check the data directory:

    ```bash
    ┗➜  psql -U postgres -c 'SHOW data_directory;'
         data_directory
    ---------------------------------
    /opt/homebrew/var/postgresql@16
    (1 Zeile)
    ```

2.  Install **ruby** version 3.2.7

    ```bash
    brew install ruby-install
    ruby-install ruby 3.2.7
    ```

3.  Install **chruby** to change the current ruby version (optional). This is helpful when having projects with different ruby versions.

    ```bash
    brew install chruby
    ```

    Ensure to implement the necessary changes in your .bashrc or .zshrc according to brew:

    ```bash
    https://formulae.brew.sh/formula/chruby
    ```

4.  [Install](https://nodejs.org/en/download/package-manager/) **nodejs** if not installed. (current working version 20.15.1 but higher versions works also fine)

    ```bash
    brew install nodejs@20
    brew link nodejs@20
    ```

    Check the node version running:

    ```bash
    node --version
    ```

5.  [Install](https://yarnpkg.com/en/docs/install) **yarn** (actual version is 1.22.22 but higher works also fine)

    ```bash
    brew install yarn@1.22.22
    ```

    Check the yarn version running:

    ```bash
    yarn --version
    ```

6.  Clone this repository to your machine.

    ```bash
    git clone https://github.com/sapcc/elektra.git
    ```

7.  Install **bundler**
    Cd into elektra/ directory and run:

    ```bash
    gem install bundler -v 2.3.20 (check for the actual version)
    ```

8.  Compile and install elektra gems
    Cd into elektra/ directory and run:

    ```bash
    bundle install
    ```

9.  Compile and install node modules
    Cd into elektra/ directory and run:

    ```bash
    bundle exec yarn
    ```

10. Create, migrate and seed the database
    Cd into elektra/ directory and run:

    ```bash
    bundle exec rake db:create db:migrate db:seed
    ```

11. Copy the **env.sample** file to a **.env** file and adjust the values

    - Set the MONSOON*OPENSTACK_AUTH_API*\* values to your devstack/openstack configuration settings
    - Enter the database configuration parameters

12. Copy the **.npmrc.sample** file to **.npmrc** and replace `$GITHUB_TOKEN` with you private access token (PAT)

13. Start the Elektra dashboard application
    a. Run rails puma server

    ```bash
    bin/rails server -p 3000
    ```

    b. Run react live compiling

    ```bash
    bin/yarn build --watch
    ```

    Browser access for Elektra: http://localhost:3000

### Linux

1. Clone the repository with `git clone https://github.com/sapcc/elektra.git`
2. Install Yarn and PostgreSQL via package manager
3. Check if the ruby version in your package manager matches the version number in `.ruby-version`.
   If yes then install ruby via your package manager. If no then follow the extra steps:
   1. Set up [rbenv](https://github.com/rbenv/rbenv) and [ruby-build](https://github.com/rbenv/ruby-build) according to their documentation.
   2. Install Ruby with `rbenv install 2.7.6` (substitute the Ruby version with the one from the aforementioned file).
4. Install Ruby gems with `bundle install`.
5. Install JavaScript packages with `yarn`.
6. Create database if not already done `./testing/with-postgres-db.sh bin/rails db:prepare`
7. In one terminal or tmux, run `yarn build --watch` to compile the JavaScript assets. Leave this running until you're done with development.
8. In a second terminal or tmux, run `./testing/with-postgres-db.sh bin/rails server -p 3000` to run the Ruby application. Leave this running, too.
9. Now you can access the GUI at `http://localhost:3000`. When coming in from a different machine, you need to set up forwarding for ports 3000, e.g. `ssh -L 3000:127.0.0.1:8180 -L 8081:127.0.0.1:8081`.

After each pull, you may have to repeat steps 4-5 if the Ruby version or any package versions were changed.

#### NixOS notes

Step 2 and 3 should be replaced with the following commands and the nix-shell must be kept open for the steps afterwards.

```bash
nix-shell
bundle config build.sqlite3 --with-sqlite3-include="$(nix-store -r "$(nix-instantiate '<nixpkgs>' -A sqlite.dev)")/include" --with-sqlite3-lib="$(nix-store -r "$(nix-instantiate '<nixpkgs>' -A sqlite.out)"'!out')/lib"
```

or with nix-command enabled:

```bash
nix develop -f shell.nix
bundle config build.sqlite3 --with-sqlite3-include="$(nix eval nixpkgs#sqlite.dev)/include" --with-sqlite3-lib="$(nix eval nixpkgs#sqlite.out)/lib"
```

## Use Elektra Request Management

1. Create another administrator user for the Default domain with email address in Horizon or with CLI
2. Configure MONSOON_DASHBOARD_MAIL_SERVER accordingly
3. Restart Elektra Application

## Available Services in Elektra

If elektra is configured against a standard DevStack installation, only the core services like identity, nova, neutron and cinder are (sometimes partly) available and
shown in Elektra. Additional services like swift, LBaaS, manila, ... will only be shown when available from the DevStack backend side.

## Create a new Plugin

For more information about plugins, see the chapter "What are Plugins?" below.

The complexity of a plugin may vary greatly depending on its purpose. For example a Lib Plugin includes no app tree and is not mountable. However, it contains a lib folder and therefore implements libraries which may be used in other plugins. The next complexity level is the ServiceLayer Plugin, which already contains a partial app tree but isn't mountable and doesn't define views, it offers a service or library which may be used in other plugins (the `Core::ServiceLayer` is an example of such a plugin). The last plugin type is the mountable plugin which includes a full app tree and its own routes and views and is able to be mounted and act as an isolated rails app (The network plugin is an example of a mountable plugin).

- Lib Plugin
  - includes a "lib" directory and no app tree
- ServiceLayer Plugin
  - includes an implementation of ServiceLayer and DomainModel
  - app tree partially available
  - is a Rails Engine
- Mountable Plugin
  - includes a full app tree
  - can be mounted and define own routes
  - is a Rails Engine

For ease-of-use we have provided a generator which generates a skeleton plugin folder structure with the necessary elements and some basic classes with the proper inheritance to get started. First decide which type of plugin you want to start developing (for more infos about plugins see "What are Plugins?" below):

#### Create Lib Plugin

` cd [Elektra root]`

`bin/generate dashboard_plugin NAME`

#### Create ServiceLayer Plugin

` cd [Elektra root]`

`bin/generate dashboard_plugin NAME --service_layer`

#### Create Mountable Plugin

` cd [Elektra root]`

`bin/generate dashboard_plugin NAME --mountable`

#### Create Mountable ServiceLayer-Plugin

` cd [Elektra root]`

`bin/generate dashboard_plugin NAME --mountable --service_layer`

#### Create React Plugin

` cd [Elektra root]`

`bin/generate dashboard_plugin NAME --react`

For more information use:
`bin/generate dashboard_plugin --help`

### Creating Migrations

If your plugin needs to save things in the Elektra database, you'll need to create a migration. Migrations and the models they belong to live within the plugin. One additional step is necessary to register your migration with the host app so that it is applied when `rake db:migrate` is called in the host app. To create a new migration in your plugin do the following:

**Background:** you have a plugin named `my_plugin`.

1. `cd [Elektra root]/plugins/my_plugin`

   Inside this (mountable) plugin you will find a bin folder and rails script within this folder.

2. `bin/generate migration entries`

   A new migration was generated under `plugins/my_plugin/db/migrations/`

3. Register this engine's migration for the global rake task

   ```ruby
   initializer 'my_plugin.append_migrations' do |app|
     unless app.root.to_s == root.to_s
       config.paths["db/migrate"].expanded.each do |path|
         app.config.paths["db/migrate"].push(path)
       end
     end
   end
   ```

4. `cd [Elektra root]`

   `rake db:migrate`

## Plugin Assets

The Elektra UI design is a theme for [Twitter Bootstrap (v3.~)](http://getbootstrap.com/). All components described in the Twitter Bootstrap documentation also work in Elektra. Additionally we have added some components of our own. We have included [Font Awesome](https://fortawesome.github.io/Font-Awesome/) for icons.

**Important:** When building views for your plugin please check existing plugins for established best practices and patterns and also check with the core team so that the user experience stays the same or similar across plugins.

In many cases the provided styles will be enough to build your views. If you need extra styles or scripts please coordinate with the core team to see whether we should include them in the core styles so they become accessible for everybody or whether they should remain specific to your plugin. **Assets that are specific to your plugin must be located in the assets folder in your plugin.**

## What are Plugins?

![Dashboard-Plugins](docs/Dashboard-Plugins.jpg?raw=true)

The concept of plugins aims to outsource parts of Elektra, thus enabling developers to work decoupled from the main app and from each other. Rather than putting everything in the "app" directory of the main app, the controllers, views and models are split into plugins. An Elektra plugin encapsulates functionality which belongs together conceptually and/or technically and which is to be integrated into Elektra for consumption by the end user. The network plugin for example contains all the necessary controllers and views as well as helper classes to create, edit and delete network objects.

The core app provides layout, user and token handling, manages the plugins and offers classes that can be extended by plugins to make use of the functionality they provide. For example, checking whether the user is registered or logged in and the logic for the rescoping is implemented in the `DashboardController` in the core app. Plugin controllers can inherit from this class and won't have to worry about user management themselves.

Furthermore, the core app provides a service layer through which plugins are able to access other plugins' service methods on the controller level.

### Service Layer

In principle an Elektra plugin is able to store data in the Elektra database and to access it via the ActiveRecord layer. However, many plugins communicate via an API with services which persist the necessary data themselves. Elektra plugins use the _Service Layer_ to communicate with these backend services. Services in this case are primarily OpenStack services like compute or identity. Though other custom services can also be accessed the same way by the plugin.

**Important:** The communication with such services requires a valid user token (OpenStack Keystone).

As described above, the `DashboardController` in the core app takes care of user authentication. Each plugin controller that inherits from this controller automatically includes a reference to `current_user` which represents the token. The plugin can now use the information in `current_user` (mainly the token) to interact with the backend services.

But how can a plugin, for example the compute plugin, access the network methods which are implemented in the network plugin? This is where the service layer comes into play. The `DashboardController` offers a method called `services` which contains the reference to all available plugin backend services. For example: `services.networking.networks` invokes the method networks from the network backend service. Thus, the _Service Layer_ represents a communication channel to the main backend service a plugin consumes and also to the other plugin backend services.

**Before you consume other backend services:** Check how expensive a backend call is. If it is expensive take steps to reduce how often the call is made (e.g. by caching, displaying the information on a view that isn't accessed very often) or at least make the call asynchronously so as to not block the rest of the page from loading.

### Driver Layer and Domain Model

To avoid services having to communicate directly with the API and each plugin having to implement its own client, we introduced a driver layer. This layer is located exactly between the service and the API client. Thereby it is possible to abstract the services from the specific client implementation. The driver implements methods that send or receive data to or from the API and are invoked directly by a service. The data format between service and driver is limited to the Ruby Hash. Hashes are in principle sufficient for further processing, but in the UI data is usually collected via HTML forms and must be validated before it is sent on to the API. Furthermore you often require helper methods that are not implemented in the hashes.

The mentioned drawbacks of pure hash use are eliminated by the concept of the Domain Model. The Domain Model wraps the data hash and implements methods that work on this hash. By inheriting from the core Domain Model (`Core::ServiceLayer::Model`) your model gets CRUD operations out of the box. You can then add additional methods for formatting, processing, etc.

Services call driver methods and map the responses to Domain Model objects and, conversely, the Domain Model objects are converted to hashes when they reach the driver layer. As a result, it is possible to work with real ruby objects in plugins rather than using hashes. In such Domain Model objects we can use validations and define helper methods.

### Plugin Folder Structure

The following diagram illustrates how plugins are structured and which core classes to inherit to make it all work as described above.
![Plugins](docs/dashboard_plugins_tree.jpg?raw=true)

[Click here for a detailed class diagram](docs/dashboard_services.pdf)

## Adding gem dependencies with native extensions

The Elektra Docker image does not contain the build chain for compiling ruby extensions. Gems which contain native extensions need to be pre-built and packaged as alpine packages (apk).

## Audit Log

Each controller which inherits from `DashboardController` provides access to audit log via audit_logger. Internally this logger uses the Rails logger and thus the existing log infrastructure.

### How to use Audit Logger

```ruby
audit_logger.info("user johndoe has deleted project 54353454353455435345")
# => [AUDIT LOG] user johndoe has deleted project 54353454353455435345
```

```ruby
audit_logger.info(current_user, "has deleted project", @project_id)
# => [AUDIT LOG] CurrentUserWrapper johndoe (7ebe1bbd17b36c685389c29bd861d8c337d70a2f56022f80b71a5a13852e6f96) has deleted project JohnProject (adac5c36277b4346bbd631811af533f3)
```

```ruby
audit_logger.info(user: johndoe, has: "deleted", project: "54353454353455435345")
# => [AUDIT LOG] user johndoe has deleted project 54353454353455435345
```

```ruby
audit_logger.info("user johndoe", "has deleted", "project 54353454353455435345")
# => [AUDIT LOG] user johndoe has deleted project 54353454353455435345
```

### Available Methods

- audit_logger.info
- audit_logger.warn
- audit_logger.error
- audit_logger.debug
- audit_logger.fatal

## Catch Errors in Controller

The Elektra ApplicationController provides a class method which allows the catching of errors and will render a well designed error page.

```ruby
rescue_and_render_exception_page [
  { "Excon::Error" => { title: 'Backend Service Error', description: 'Api Error', details: -> e {e.backtrace.join("\n")}}},
  { "Fog::OpenStack::Errors::ServiceError" => { title: 'Backend Service Error' }},
  "Core::ServiceLayer::Errors::ApiError"
]
```

Errors that are caught in this way, are rendered within the application layout so that the navigation remains visible. For example if a service is unavailable the user gets to see an error but she can still navigate to other services.

rescue_and_render_exception_page accepts an array of hashes and/or strings. In case you want to overwrite the rendered attributes you should provide a hash with a mapping.

Available attributes:

- `title` (error title)
- `description` (error message)
- `details` (some details like backtrace)
- `exception_id` (default is request uuid)
- `warning` (default false. If true a warning page is rendered instead of error page)

## Pagination

### Controller

```ruby
@images = paginatable(per_page: 15) do |pagination_options|
  services.image.images({sort_key: 'name', visibility: @visibility}.merge(pagination_options))
end
```

### View

```ruby
= render_paginatable(@images)
```

## Mailer

From 19.08.2022 Elektra is using our own email service (Cronus) to send emails when users must be notified. This is the case for example when managing quota requests or creating new projects. Refer to [config/mailer.md](config/mailer.md) for details on how the mailer is setup.

## Support, Feedback, Contributing

This project is open to feature requests/suggestions, bug reports etc. via [GitHub issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue). Contribution and feedback are encouraged and always welcome. For more information about how to contribute, please read [CONTRIBUTING.md](https://github.com/sapcc/elektra/blob/master/CONTRIBUTING.md) for details and the process for submitting pull requests to us.

## Tailwind CSS Support

We use esbuild to build javascript bundles. In `/app/javascript/essentials.js` (which is referenced in the layout files) we import `/app/javascript/tailwind.css` file. This file also imports styles from _juno-ui-components_ to use the juno color variables.

```sass
@import "@cloudoperators/juno-ui-components/build/styles.css";
```

## Security / Disclosure

If you find any bug that may be a security problem, please follow our instructions [in our security policy](https://github.com/SAP-cloud-infrastructure/.github/blob/main/SECURITY.md) on how to report it. Please do not create GitHub issues for security-related doubts or problems.

## Code of Conduct

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone. By participating in this project, you agree to abide by its [Code of Conduct](https://github.com/SAP-cloud-infrastructure/.github/blob/main/CODE_OF_CONDUCT.md) at all times.

## Licensing

Copyright 2015-2025 SAP SE or an SAP affiliate company and elektra contributors. Please see our [LICENSE](LICENSE) for copyright and license information. Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/sapcc/elektra).
