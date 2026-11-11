# frozen_string_literal: true

require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::Glance do
  let(:test_class) { Class.new { extend ServiceLayer::ComputeNjqServices::Glance } }

  let(:elektron_glance) do
    double("elektron_glance").tap do |mock|
      allow(mock).to receive(:get).with("images", {}).and_return(
        double("response", body: { "images" => [{ "id" => "i1", "name" => "ubuntu" }] }),
      )
    end
  end

  before { allow(test_class).to receive(:elektron_glance).and_return(elektron_glance) }

  describe "#glance_images" do
    it "returns the images array" do
      expect(test_class.glance_images).to eq([{ "id" => "i1", "name" => "ubuntu" }])
    end

    it "returns [] when the body has no images" do
      allow(elektron_glance).to receive(:get).with("images", {}).and_return(
        double("response", body: {}),
      )
      expect(test_class.glance_images).to eq([])
    end
  end
end
