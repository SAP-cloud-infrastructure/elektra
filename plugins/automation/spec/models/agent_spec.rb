require "spec_helper"
require "ostruct"

RSpec.describe Automation::Node, :skip do
  # describe 'create_agents' do
  #
  #   it "should create nodes from the api" do
  #     agent1 = double('agent1', agent_id: 'agent1', facts: OpenStruct.new(:hostname => "hostname_agent1"), tags: OpenStruct.new(:name => 'tag name for agent1'))
  #     agent2 = double('agent2', agent_id: 'agent2', facts: OpenStruct.new(:hostname => "hostname_agent2"), tags: {})
  #     pagination = double('pagination', total_elements: 2)
  #     nodes = double('nodes', data: [agent1, agent2], pagination: pagination)
  #
  #     expect(Automation::Agent.create_agents(nodes)[:elements].length).to be == 2
  #     # Agent 1
  #     expect(Automation::Agent.create_agents(nodes)[:elements][0].id).to be == 'agent1'
  #     expect(Automation::Agent.create_agents(nodes)[:elements][0].name).to be == 'tag name for agent1'
  #     expect(Automation::Agent.create_agents(nodes)[:elements][0].facts.hostname).to be == 'hostname_agent1'
  #     # Agent 2
  #     expect(Automation::Agent.create_agents(nodes)[:elements][1].id).to be == 'agent2'
  #     expect(Automation::Agent.create_agents(nodes)[:elements][1].name).to be == 'hostname_agent2'
  #     expect(Automation::Agent.create_agents(nodes)[:elements][1].facts.hostname).to be == 'hostname_agent2'
  #   end
  #
  # end

  describe "os_types" do
    it "should return the os types" do
      expect(Automation::Node.os_types).to match(
        { "linux" => "Linux", "windows" => "Windows" },
      )
    end
  end
end
