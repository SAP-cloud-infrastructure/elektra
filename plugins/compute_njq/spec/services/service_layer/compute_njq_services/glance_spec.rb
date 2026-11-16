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

  describe "#glance_images with a filter" do
    it "forwards the filter (name, marker, limit) to Glance" do
      allow(elektron_glance).to receive(:get).with("images", { "limit" => 50, "name" => "ubuntu" }).and_return(
        double("response", body: { "images" => [{ "id" => "i1", "name" => "ubuntu" }] }),
      )
      expect(test_class.glance_images({ "limit" => 50, "name" => "ubuntu" })).to eq(
        [{ "id" => "i1", "name" => "ubuntu" }],
      )
    end
  end

  describe "#glance_all_images" do
    it "pages via marker until an empty page ends the loop and concatenates the results" do
      allow(elektron_glance).to receive(:get).with("images", { "visibility" => "public" }).and_return(
        double("response", body: { "images" => [{ "id" => "i1" }, { "id" => "i2" }] }),
      )
      allow(elektron_glance).to receive(:get)
        .with("images", { "visibility" => "public", "marker" => "i2" }).and_return(
          double("response", body: { "images" => [{ "id" => "i3" }] }),
        )
      allow(elektron_glance).to receive(:get)
        .with("images", { "visibility" => "public", "marker" => "i3" }).and_return(
          double("response", body: { "images" => [] }),
        )

      expect(test_class.glance_all_images("visibility" => "public").map { |i| i["id"] }).to eq(%w[i1 i2 i3])
    end

    it "returns the single page without paging when it is already empty" do
      allow(elektron_glance).to receive(:get).with("images", { "visibility" => "private" }).and_return(
        double("response", body: { "images" => [] }),
      )
      expect(test_class.glance_all_images("visibility" => "private")).to eq([])
    end
  end
end
