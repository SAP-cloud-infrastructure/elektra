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
    "object_id": "56780c30-09ac-46b3-9352-16c144f8890d"
  },
  {
    "id": "job_002",
    "created_at": "2024-01-15T09:15:00Z",
    "name": "Hypervisor Migration - Web Server",
    "policy": "infrastructure_migration",
    "description": "Migrate web server from VMware vSphere to Proxmox hypervisor for better resource utilization",
    "state": "running",
    "schedule_date": "2024-01-15T10:00:00Z",
    "due_date": "2024-01-15T14:00:00Z",
    "object_type": "server",
    "object_id": "ed080e9c-5701-447f-b631-311b6a2fe282"
  },
  {
    "id": "job_003",
    "created_at": "2024-01-15T07:45:00Z",
    "name": "Kernel Update - Application Server",
    "policy": "security_update",
    "description": "Apply critical kernel security updates and reboot application server",
    "state": "scheduled",
    "schedule_date": "2024-01-20T02:00:00Z",
    "due_date": "2024-01-20T05:00:00Z",
    "object_type": "server",
    "object_id": "srv_app_001"
  },
  {
    "id": "job_004",
    "created_at": "2024-01-15T11:20:00Z",
    "name": "RAM Upgrade - Database Server",
    "policy": "hardware_maintenance",
    "description": "Upgrade database server RAM from 64GB to 128GB to improve query performance during peak hours",
    "state": "pending",
    "schedule_date": "2024-01-15T18:00:00Z",
    "due_date": "2024-01-15T20:00:00Z",
    "object_type": "server",
    "object_id": "srv_db_primary"
  },
  {
    "id": "job_005",
    "created_at": "2024-01-15T06:30:00Z",
    "name": "Emergency Server Restart",
    "policy": "emergency_restart",
    "description": "Emergency restart of application server due to memory leak detection and system instability",
    "state": "failed",
    "schedule_date": "2024-01-15T07:00:00Z",
    "due_date": "2024-01-15T07:30:00Z",
    "object_type": "server",
    "object_id": "srv_app_003"
  },
  {
    "id": "job_006",
    "created_at": "2024-01-15T12:00:00Z",
    "name": "HDD Replacement - File Server",
    "policy": "hardware_maintenance",
    "description": "Replace failing 2TB hard drive in RAID array on file server before complete failure",
    "state": "waiting",
    "schedule_date": "2024-01-15T16:00:00Z",
    "due_date": "2024-01-15T17:00:00Z",
    "object_type": "server",
    "object_id": "srv_file_storage"
  },
  {
    "id": "job_007",
    "created_at": "2024-01-15T10:45:00Z",
    "name": "Hypervisor Migration - Mail Server",
    "policy": "infrastructure_migration",
    "description": "Migrate mail server from aging Hyper-V host to new KVM hypervisor infrastructure",
    "state": "canceled",
    "schedule_date": "2024-01-15T22:00:00Z",
    "due_date": "2024-01-16T01:00:00Z",
    "object_type": "server",
    "object_id": "srv_mail_exchange"
  },
  {
    "id": "job_008",
    "created_at": "2024-01-15T13:30:00Z",
    "name": "SSD Upgrade - Web Server",
    "policy": "hardware_maintenance",
    "description": "Upgrade web server storage from traditional HDD to NVMe SSD for improved I/O performance",
    "state": "initial",
    "schedule_date": "",
    "due_date": "2024-01-25T03:00:00Z",
    "object_type": "server",
    "object_id": "ed080e9c-5701-447f-b631-311b6a2fe282"
  },
  {
    "id": "job_009",
    "created_at": "2024-01-15T14:15:00Z",
    "name": "Kernel Update - Monitoring Server",
    "policy": "monthly_updates",
    "description": "Apply monthly kernel updates and security patches to monitoring server infrastructure",
    "state": "cancelling",
    "schedule_date": "2024-01-15T15:00:00Z",
    "due_date": "2024-01-15T18:00:00Z",
    "object_type": "server",
    "object_id": "srv_monitoring_001"
  },
  {
    "id": "job_010",
    "created_at": "2024-01-15T08:00:00Z",
    "name": "CPU Upgrade - Compute Server",
    "policy": "hardware_maintenance",
    "description": "Upgrade compute server CPU from Intel Xeon E5-2690 to E5-2695 v4 for increased processing power",
    "state": "error",
    "schedule_date": "2024-01-15T03:00:00Z",
    "due_date": "2024-01-15T05:00:00Z",
    "object_type": "server",
    "object_id": "srv_compute_node_03"
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