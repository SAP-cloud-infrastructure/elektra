require "spec_helper"
require_relative "../factories/factories"

describe Automation::Automation, :skip do
  describe "loading nested hashes" do
    it "should create an automation" do
      environment = { "test" => { "miau" => "bup" } }
      chef_attributes = { "test" => { "miau" => "bup" } }
      tags = { "test" => { "miau" => "bup" } }
      automation =
        ::Automation::FakeFactory.new.automation(
          {
            environment: environment,
            chef_attributes: chef_attributes,
            tags: tags,
          },
        )
      expect(automation.environment.to_json).to eq(environment.to_json)
      expect(automation.chef_attributes.to_json).to eq(chef_attributes.to_json)
      expect(automation.tags.to_json).to eq(tags.to_json)
    end

    it "should create an automation with no valid keys" do
      environment = { "test%64" => { "miau" => "bup" } }
      chef_attributes = { "docker-compos" => { "miau" => "bup" } }
      tags = { "öäü" => { "miau" => "bup" } }
      automation =
        ::Automation::FakeFactory.new.automation(
          {
            environment: environment,
            chef_attributes: chef_attributes,
            tags: tags,
          },
        )
      expect(automation.environment.to_json).to eq(environment.to_json)
      expect(automation.chef_attributes.to_json).to eq(chef_attributes.to_json)
      expect(automation.tags.to_json).to eq(tags.to_json)
    end
  end
end
