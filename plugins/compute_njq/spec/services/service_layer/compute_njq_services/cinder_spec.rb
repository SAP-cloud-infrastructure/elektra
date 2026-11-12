# frozen_string_literal: true

require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::Cinder do
  let(:test_class) { Class.new { extend ServiceLayer::ComputeNjqServices::Cinder } }

  let(:elektron_cinder) do
    double("elektron_cinder").tap do |mock|
      allow(mock).to receive(:get).with("volumes/v1").and_return(
        double("response", body: { "volume" => { "id" => "v1", "size" => 50 } }),
      )
    end
  end

  before { allow(test_class).to receive(:elektron_cinder).and_return(elektron_cinder) }

  describe "#cinder_volume" do
    it "returns the volume hash" do
      expect(test_class.cinder_volume("v1")).to eq("id" => "v1", "size" => 50)
    end

    it "returns nil when the volume cannot be resolved" do
      allow(elektron_cinder).to receive(:get).with("volumes/missing").and_raise(
        Elektron::Errors::ApiResponse.new(double(code: 404, body: {})),
      )
      expect(test_class.cinder_volume("missing")).to be_nil
    end
  end
end
