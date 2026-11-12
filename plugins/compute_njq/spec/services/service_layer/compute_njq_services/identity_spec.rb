# frozen_string_literal: true

require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::Identity do
  let(:test_class) { Class.new { extend ServiceLayer::ComputeNjqServices::Identity } }

  let(:elektron_identity) do
    double("elektron_identity").tap do |mock|
      allow(mock).to receive(:get).with("projects/p1").and_return(
        double("response", body: { "project" => { "id" => "p1", "name" => "Demo" } }),
      )
    end
  end

  before { allow(test_class).to receive(:elektron_identity).and_return(elektron_identity) }

  describe "#identity_project" do
    it "returns the project hash" do
      expect(test_class.identity_project("p1")).to eq("id" => "p1", "name" => "Demo")
    end

    it "returns nil for a blank id without calling the API" do
      expect(test_class.identity_project(nil)).to be_nil
    end

    it "returns nil when the project cannot be resolved" do
      allow(elektron_identity).to receive(:get).with("projects/missing").and_raise(
        Elektron::Errors::ApiResponse.new(double(code: 404, body: {})),
      )
      expect(test_class.identity_project("missing")).to be_nil
    end
  end
end
