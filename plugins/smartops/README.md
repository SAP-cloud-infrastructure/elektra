# SmartOps Feature for Elektra

A new operational job management interface that provides project members and administrators with visibility and control over backend operational tasks such as VM migrations and firmware upgrades.

## :dart: Overview

SmartOps introduces a dedicated view in Elektra where users can monitor, schedule, and manage operational jobs created by the backend API. The feature enables proactive job scheduling within validity periods and provides comprehensive status tracking.

## :sparkles: Key Features

- **Job Visibility** - View all project-related operational jobs with type, schedule, and status information
- **Smart Scheduling** - Schedule unscheduled jobs within their validity periods
- **Flexible Rescheduling** - Modify existing job schedules to align with project planning
- **Status Monitoring** - Real-time job status tracking (pending, running, successful, failed, etc.)
- **Role-based Access** - Appropriate permissions for different user roles

## :wrench: Technical Implementation

### API Integration

- **Authentication**: Keystone Ferret Token via `Auth-Token` header
- **Endpoints**:
  - `GET /jobs` - List and filter jobs
  - `PATCH /jobs` - Schedule/reschedule jobs
- **Filtering**: By name, type, ID, schedule date, and due date
- **Timestamp Format**: ISO 8601 UTC (`YYYY-MM-DDTHH:MM:SS.sssZ`)

### Job States

`initial` • `scheduled` • `pending` • `waiting` • `running` • `successful` • `error` • `reset` • `canceled` • `cancelling` • `failed`

## Contributing

Contribution directions go here.

## License

The gem is available as open source under the terms of the [Apache License 2.0](https://opensource.org/licenses/Apache-2.0).
