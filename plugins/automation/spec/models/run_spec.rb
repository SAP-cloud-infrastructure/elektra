require "spec_helper"
require_relative "../factories/factories"

describe Automation::Run, :skip do
  describe "snapshot" do
    it "should return an empty hash if no data available" do
      run = ::Automation::FakeFactory.new.run(automation_attributes: {})
      expect(run.snapshot).to eq({})

      run2 = ::Automation::FakeFactory.new.run(automation_attributes: nil)
      expect(run2.snapshot).to eq({})
    end

    it "should return a hash if data available" do
      run = ::Automation::FakeFactory.new.run
      expect(run.snapshot.to_json).to match(
        ::Automation::FakeFactory.new.automation.attributes.to_json,
      )
    end
  end

  describe "revision_from_github?" do
    it "should return true if it is from github" do
      run = ::Automation::FakeFactory.new.run
      expect(run.revision_from_github?).to be_truthy
    end

    it "should return false for the other cases" do
      automation =
        ::Automation::FakeFactory.new.automation(
          { repository: "https://server.com/test/chef-test.git" },
        )
      run =
        ::Automation::FakeFactory.new.run(
          { automation_attributes: automation.attributes },
        )
      expect(run.revision_from_github?).to be_falsey
    end
  end

  describe "revision_link" do
    it "should return a link" do
      run = ::Automation::FakeFactory.new.run
      expect(run.revision_link).to eq(
        "https://github.com/sapcc/chef-test/commit/c7b3ee00635673294619070fafbccf27a23bcbd4",
      )
    end

    it "should return just the revision sha if no github repo" do
      automation =
        ::Automation::FakeFactory.new.automation(
          { repository: "https://server.com/sapcc/chef-test.git" },
        )
      run =
        ::Automation::FakeFactory.new.run(
          { automation_attributes: automation.attributes },
        )
      expect(run.revision_link).to eq(
        "c7b3ee00635673294619070fafbccf27a23bcbd4",
      )
    end
  end

  describe "loading nested hashes" do
    # it "should create a run" do
    #   # automation
    #   environment = {'test' => {'miau' => 'bup'}}
    #   chef_attributes = {'test' => {'miau' => 'bup'}}
    #   tags = {'test' => {'miau' => 'bup'}}
    #   automation = ::Automation::FakeFactory.new.automation({environment:environment, chef_attributes: chef_attributes, tags: tags})
    #   # owner
    #   owner = {"id"=>"b2ff8f4a7d1eab4f5cf82489f76e52fc1934c1b4d4a7a4a9bd9ce82ca1310bbc",
    #    "name"=>"Musterman",
    #    "domain_id"=>"ec213443e8834473b579f7bea9e8c194",
    #    "domain_name"=>"monsoon3"}
    #
    #   run = ::Automation::FakeFactory.new.run({automation_attributes: automation, owner: owner})
    #   expect(run.automation_attributes.to_json).to eq(automation.to_json)
    #   expect(run.owner.to_json).to eq(owner.to_json)
    # end

    it "should create a run with no valid keys" do
      # automation
      environment = { "test%64" => { "miau" => "bup" } }
      chef_attributes = { "docker-compos" => { "miau" => "bup" } }
      tags = { "öäü" => { "miau" => "bup" } }
      automation = {
        environment: environment,
        chef_attributes: chef_attributes,
        tags: tags,
      }

      # owner
      owner = {
        "äüß" => {
          "miau" => "bup",
        },
        "name-test" => {
          "miau" => "bup",
        },
        "domain_id" => {
          "miau" => "bup",
        },
        "domain_name" => {
          "miau" => "bup",
        },
      }

      run =
        ::Automation::FakeFactory.new.run(
          { automation_attributes: automation, owner: owner },
        )
      expect(run.automation_attributes.to_json).to eq(automation.to_json)
      expect(run.owner.to_json).to eq(owner.to_json)
    end
  end
end
