MOCK_DATA = [
  {
    "id": "job_001",
    "created_at": "2024-01-15T08:30:00Z",
    "name": "Server Backup - Production DB",
    "policy": "daily_backup",
    "description": "Daily backup of production database server including all user data and system configurations",
    "state": "successful",
    "schedule_date": "2024-01-15T23:00:00Z",
    "due_date": "2024-01-16T06:00:00Z",
    "object_type": "server",
    "object_id": "srv_prod_db_001"
  },
  {
    "id": "job_002",
    "created_at": "2024-01-15T09:15:00Z",
    "name": "Network Security Scan",
    "policy": "weekly_security_scan",
    "description": "Comprehensive security vulnerability scan of the corporate network infrastructure",
    "state": "running",
    "schedule_date": "2024-01-15T10:00:00Z",
    "due_date": "2024-01-15T14:00:00Z",
    "object_type": "network",
    "object_id": "net_corp_main"
  },
  {
    "id": "job_003",
    "created_at": "2024-01-15T07:45:00Z",
    "name": "Web Server Maintenance",
    "policy": "monthly_maintenance",
    "description": "Routine maintenance including system updates, log rotation, and performance optimization",
    "state": "scheduled",
    "schedule_date": "2024-01-20T02:00:00Z",
    "due_date": "2024-01-20T05:00:00Z",
    "object_type": "server",
    "object_id": "srv_web_001"
  },
  {
    "id": "job_004",
    "created_at": "2024-01-15T11:20:00Z",
    "name": "Load Balancer Configuration Update",
    "policy": "on_demand",
    "description": "Update load balancer configuration to handle increased traffic during peak hours",
    "state": "pending",
    "schedule_date": "2024-01-15T18:00:00Z",
    "due_date": "2024-01-15T20:00:00Z",
    "object_type": "network",
    "object_id": "net_lb_cluster_01"
  },
  {
    "id": "job_005",
    "created_at": "2024-01-15T06:30:00Z",
    "name": "Application Server Restart",
    "policy": "emergency_restart",
    "description": "Emergency restart of application server due to memory leak detection",
    "state": "failed",
    "schedule_date": "2024-01-15T07:00:00Z",
    "due_date": "2024-01-15T07:30:00Z",
    "object_type": "server",
    "object_id": "srv_app_003"
  },
  {
    "id": "job_006",
    "created_at": "2024-01-15T12:00:00Z",
    "name": "Firewall Rule Update",
    "policy": "security_update",
    "description": "Update firewall rules to block newly identified malicious IP ranges",
    "state": "waiting",
    "schedule_date": "2024-01-15T16:00:00Z",
    "due_date": "2024-01-15T17:00:00Z",
    "object_type": "network",
    "object_id": "net_firewall_main"
  },
  {
    "id": "job_007",
    "created_at": "2024-01-15T10:45:00Z",
    "name": "Database Index Optimization",
    "policy": "performance_optimization",
    "description": "Optimize database indexes to improve query performance for reporting system",
    "state": "canceled",
    "schedule_date": "2024-01-15T22:00:00Z",
    "due_date": "2024-01-16T01:00:00Z",
    "object_type": "server",
    "object_id": "srv_reporting_db"
  },
  {
    "id": "job_008",
    "created_at": "2024-01-15T13:30:00Z",
    "name": "SSL Certificate Renewal",
    "policy": "certificate_renewal",
    "description": "Renew SSL certificates for all web services before expiration",
    "state": "initial",
    "schedule_date": "",
    "due_date": "2025-11-01T03:00:00Z",
    "object_type": "server",
    "object_id": "srv_web_cluster"
  },
  {
    "id": "job_009",
    "created_at": "2024-01-15T14:15:00Z",
    "name": "Network Bandwidth Analysis",
    "policy": "monthly_analysis",
    "description": "Analyze network bandwidth usage patterns and generate capacity planning report",
    "state": "cancelling",
    "schedule_date": "2024-01-15T15:00:00Z",
    "due_date": "2024-01-15T18:00:00Z",
    "object_type": "network",
    "object_id": "net_wan_primary"
  },
  {
    "id": "job_010",
    "created_at": "2024-01-15T08:00:00Z",
    "name": "Log Archive Cleanup",
    "policy": "weekly_cleanup",
    "description": "Archive old log files and clean up disk space on logging servers",
    "state": "error",
    "schedule_date": "2024-01-15T03:00:00Z",
    "due_date": "2024-01-15T05:00:00Z",
    "object_type": "server",
    "object_id": "srv_logging_001"
  }
]

module ServiceLayer
  module SmartopsServices
    module Jobs

      def list_jobs(filter = {})
        sleep(rand(0..3)) # Simulate random network delay between 0 and 3 seconds
        jobs = MOCK_DATA # if api is available, fetch data from there

        # Filter by name (partial match, case-insensitive)
        if filter[:name]
          jobs = jobs.select do |job|
            job[:name].downcase.include?(filter[:name].downcase)
          end
        end

        # Filter by type (object_type)
        if filter[:type]
          jobs = jobs.select do |job|
            job[:object_type] == filter[:type]
          end
        end

        # Filter by id (exact match)
        if filter[:id]
          jobs = jobs.select do |job|
            job[:id] == filter[:id]
          end
        end

        # Filter by scheduled_date (assuming you want jobs scheduled on or after this date)
        if filter[:scheduled_date]
          filter_date = Time.parse(filter[:scheduled_date])
          jobs = jobs.select do |job|
            job_date = Time.parse(job[:schedule_date])
            job_date >= filter_date
          end
        end

        # Filter by due_date (assuming you want jobs due on or before this date)
        if filter[:due_date]
          filter_date = Time.parse(filter[:due_date])
          jobs = jobs.select do |job|
            job_date = Time.parse(job[:due_date])
            job_date <= filter_date
          end
        end

        jobs
      end

      def schedule_job(id, schedule_date)
        puts "Scheduling job in service layer: ID #{id} with schedule_date: #{schedule_date}"
        job = MOCK_DATA.find { |j| j[:id] == id }
        raise "Job not found" unless job

        job[:schedule_date] = schedule_date
        job
      end

      #def list_jobs(filter = {})
      #  response = elektron_smartops.get("jobs", filter)
      #  {
      #    items: response.map_to("body.jobs", &job_map),
      #    total: response.body.fetch("metadata", {}).fetch("total_count", nil),
      #  }
      #end
    end
  end
end