module ServiceLayer
  module SmartopsServices
    module Jobs

      def list_jobs(filter = {})
        response = elektron_smartops.get("jobs", filter)
        {
          items: response.map_to("body.jobs", &job_map),
          total: response.body.fetch("metadata", {}).fetch("total_count", nil),
        }
      end
    end
  end
end