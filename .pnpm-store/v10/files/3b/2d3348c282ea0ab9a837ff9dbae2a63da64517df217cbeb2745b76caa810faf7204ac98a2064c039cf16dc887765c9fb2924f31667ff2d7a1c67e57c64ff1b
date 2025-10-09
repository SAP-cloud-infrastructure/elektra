# LimesUI App

Provides an elektra interface for the new resource management and billing model for the CCloud OpenStack infrastructure. Utilizes the API endpoints provided by Limes.

A more detailed description about the architecture can be found here:
[Architecture](/architecture/architectureDescription.md)

## How to build

1. Install dependencies

```sh
npm install
```

2. Create a `secretProps.json` file in the root directory with the following contents:

```s
{
  "theme": "theme-light" or "theme-dark"
  "endpoint": <Endpoint to the Limes API>
  "projectID":
  "domainID":
  "token": <OpenStack Keystone Token>
  "canEdit": <Defines if commitments can be created on resources>
  "mockAPI": <Query real API or use provided mockdata.>
}
```

If the `mockAPI` attribute is set to `true` the endpint attribute becomes optional.

3. Run the app:

```sh
APP_PORT=8000 npm run start
```

Then navigate to <http://localhost:8000/>.

## Instructions

The new calculation model is explained and provided at the [Limes API specifications](https://github.com/sapcc/limes/blob/master/docs/users/api-spec-resources.md)

- Visit the resource management section in elektra or use the local version of this UI.

- the resources available in the chosen project will be visible in a tile view.

- Resources that can be edited and have no commitments will be displayed in purple color. The resource bar displayed will have the following structrue:

```sh
<Usage>/<Available Quota>
```

- Resources that contain commitments will have the following structure:

```sh
<Usage>/<sum(Commitments)> | <Usage that exceeds Commitments>/<Remaining Quota>
```

- Resources that contain commitments that are not yet confirmed will have a `pending` label attached to them.

## Contribution

Please open a issue in this repository and state the feature or error that you would like to have addressed.

## Contact

If any other issues or questions arise, please contact `Stefan Voigt` in Slack or per Mail:
`s.voigt@sap.com`
