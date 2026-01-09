module ServiceLayer
  module SmartopsServices
    module Jobs
      # Note: error handling is done in the api controller

      def list_jobs(filter = {})
        jobs = elektron_smartops.get("jobs/", filter).body["jobs"]
        # for testing purposes, you can uncomment and modify the following lines to simulate different job states
        #jobs[0]["state"] = "inital"
        #jobs[0]["schedule_date"] = ""
        #jobs[0]["due_date"] = "2025-12-31T11:00:15Z"
        
        # Filter by name (partial match, case-insensitive)
        if filter[:name]
          jobs = jobs.select do |job|
            job["name"].downcase.include?(filter[:name].downcase)
          end
        end

        # Filter by type (object_type)
        if filter[:type]
          jobs = jobs.select do |job|
            job["object_type"] == filter[:type]
          end
        end

        # Filter by id (exact match)
        if filter[:id]
          jobs = jobs.select do |job|
            job["id"] == filter[:id]
          end
        end

        # Filter by scheduled_date (assuming you want jobs scheduled on or after this date)
        if filter[:scheduled_date]
          filter_date = Time.parse(filter[:scheduled_date])
          jobs = jobs.select do |job|
            job_date = Time.parse(job["schedule_date"])
            job_date >= filter_date
          end
        end

        # Filter by due_date (assuming you want jobs due on or before this date)
        if filter[:due_date]
          filter_date = Time.parse(filter[:due_date])
          jobs = jobs.select do |job|
            job_date = Time.parse(job["due_date"])
            job_date <= filter_date
          end
        end
        jobs
      end

      def schedule_job(id, schedule_date)
        Rails.logger.debug "Scheduling job in service layer: ID #{id} with schedule_date: #{schedule_date}"
        elektron_smartops.post("jobs/#{id}/schedule") do { schedule_date_utc: schedule_date } end
        return true
      end
    end
  end
end
