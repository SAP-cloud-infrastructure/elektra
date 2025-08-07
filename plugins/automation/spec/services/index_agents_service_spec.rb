require "spec_helper"

RSpec.describe IndexNodesService do
  skip "Temporarily skipping all tests in this file"
  
  describe "initialization" do
    it "should raise an error if no automation_service is given" do
      compute_service = double("compute_service")
      expect { IndexNodesService.new(nil) }.to raise_error(
        IndexNodesServiceParamError,
      )
    end

    it "should initialize an object" do
      automation_service = double("automation_service")
      expect { IndexNodesService.new(automation_service) }.not_to raise_error
      expect(IndexNodesService.new(automation_service)).not_to be_nil
    end
  end

  describe "list_agents" do
    it "should return all nodes with the corresponding jobs" do
      node1 = double("node", id: "test_1")
      node2 = double("node", id: "external_node_id")
      node1_jobs =
        double(
          "jobs_agent1",
          data: [
            { request_id: "agent1_1" },
            { request_id: "agent1_2" },
            { request_id: "agent1_3" },
            { request_id: "agent1_4" },
            { request_id: "agent1_5" },
          ],
        )
      node2_jobs =
        double(
          "jobs_agent2",
          data: [
            { request_id: "agent2_1" },
            { request_id: "agent2_2" },
            { request_id: "agent2_3" },
            { request_id: "agent2_4" },
            { request_id: "agent2_5" },
          ],
        )
      automation_service =
        double("automation_service", nodes: { elements: [node1, node2] })

      allow(automation_service).to receive(:jobs).with("test_1", 1, 5) {
        node1_jobs
      }
      allow(automation_service).to receive(:jobs).with(
        "external_node_id",
        1,
        5,
      ) { node2_jobs }

      compute_service = double("compute_service")
      addresses = {
        "SCI Lab" => [
          {
            "OS-EXT-IPS-MAC:mac_addr" => "fa:16:3e:8e:b1:4f",
            "version" => 4,
            "addr" => "10.0.0.240",
            "OS-EXT-IPS:type" => "fixed",
          },
          {
            "OS-EXT-IPS-MAC:mac_addr" => "fa:16:3e:8e:b1:4f",
            "version" => 4,
            "addr" => "10.47.0.28",
            "OS-EXT-IPS:type" => "floating",
          },
        ],
      }
      servers = [
        double("server1", id: "test_1", addresses: addresses),
        double("server2", id: "test_2", addresses: {}),
      ]
      allow(compute_service).to receive(:servers) { servers }

      expect(
        IndexNodesService.new(automation_service).list_nodes_with_jobs(1, 5),
      ).to match(
        {
          elements: [node1, node2],
          jobs: {
            test_1: node1_jobs,
            external_node_id: node2_jobs,
          },
        },
      )
    end
  end
end
