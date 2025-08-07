module ServiceLayer
  class ServiceNotAvailable < StandardError
  end

  class AutomationService < Core::ServiceLayer::Service
    attr_reader :client

    def available?(_action_name_sym = nil)
      # disabling the service since it is in sunset mode
      # and will be removed in the future
      false
    end

    def install_node_available?
      %w[arc_updates_url arc_pki_url arc_broker_url].all? do |key|
        AUTOMATION_CONF[key].present?
      end
    end

    def arc_service_endpoint
      elektron.service_url("arc", region: ENV["MONSOON_DASHBOARD_REGION"]) || ""
    end

    def automation_service_endpoint
      elektron.service_url(
        "automation",
        region: ENV["MONSOON_DASHBOARD_REGION"],
      ) || ""
    end

    #
    # Nodes (Agents, ArcClient)
    #

    def client
      @client ||= ArcClient::Client.new(arc_service_endpoint)
    end

    def nodes(filter = "", show_facts = [], page = 0, per_page = 0)
      ::Automation::Node.create_nodes(
        client.list_agents!(elektron.token, filter, show_facts, page, per_page),
      )
    end

    def node(node_id = "", show_facts = [])
      ::Automation::Node.new(
        client.find_agent!(elektron.token, node_id, show_facts),
      )
    end

    def node_facts(node_id = "")
      ::Automation::Facts.new(client.show_agent_facts!(elektron.token, node_id))
    end

    def node_add_tags(node_id = "", tags = {})
      response = client.add_agent_tags!(elektron.token, node_id, tags)
      !response.nil?
    end

    def node_delete_tag(node_id = "", key = "")
      response = client.delete_agent_tag!(elektron.token, node_id, key)
      !response.nil?
    end

    def node_delete(node_id = "")
      response = client.delete_agent!(elektron.token, node_id)
      !response.nil?
    end

    def node_install_script(common_name = "", options = {})
      client.agent_init!(elektron.token, common_name, options)
    end

    #
    # Jobs (ArcClient)
    #

    def jobs(node_id = "", page = 0, per_page = 0)
      Automation::Job.create_jobs(
        client.list_jobs!(elektron.token, node_id, page, per_page),
      )
    end

    def job(job_id)
      Automation::Job.new(client.find_job!(elektron.token, job_id))
    end

    def job_log(job_id)
      client.find_job_log!(elektron.token, job_id)
    end

    #
    # Automations (ActiveResource)
    #

    def automation_service
      Automation::Automation.site =
        ::File.join(
          ENV.fetch("LYRA_ENDPOINT") { automation_service_endpoint },
          "api/v1",
        )
      Automation::Automation.headers = { "X-Auth-Token" => elektron.token }
      Automation::Automation
    end

    def automation_run_service
      Automation::Run.site =
        ::File.join(
          ENV.fetch("LYRA_ENDPOINT") { automation_service_endpoint },
          "api/v1",
        )
      Automation::Run.headers = { "X-Auth-Token" => elektron.token }
      Automation::Run
    end

    def automations(page = 0, per_page = 0)
      automation_service.find(:all, {}, page: page, per_page: per_page)
    end

    def automations_collect_all
      page = 1
      per_page = 100
      automations = []
      # first call
      partial_collection =
        automation_service.find(:all, {}, page: page, per_page: per_page)
      # collect information to loop
      page = partial_collection.current_page
      total_pages = partial_collection.total_pages
      automations = partial_collection.elements
      # loop
      while page < total_pages
        page += 1
        partial_collection =
          automation_service.find(:all, {}, page: page, per_page: per_page)
        automations += partial_collection.elements
        break if page > 10 # avoid endlos loop 10 * 100 = 1000 automations. This should cover all cases
      end
      automations
    end

    def automation(automation_id)
      automation_service.find(automation_id, {})
    end

    def automation_runs(page = 0, per_page = 0)
      automation_run_service.find(:all, {}, page: page, per_page: per_page)
    end

    def automation_run(run_id)
      automation_run_service.find(run_id, {})
    end

    def automation_execute(automation_id, selector)
      automation_run_service.new(
        nil,
        automation_id: automation_id,
        selector: selector,
      )
    end
  end
end
