# frozen_string_literal: true
require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::Snapshot do
  let(:test_class) do
    Class.new do
      include ServiceLayer::ComputeNjqServices::Snapshot
    end.new
  end
  let(:elektron_nova) { double("elektron_nova") }

  before { allow(test_class).to receive(:elektron_nova).and_return(elektron_nova) }

  describe "#create_instance_snapshot" do
    it "posts createImage and returns the image id from the Location header" do
      response = double("response", header: { "Location" => "https://nova/v2.1/images/img-7" }, body: {})
      allow(elektron_nova).to receive(:post).with("servers/s1/action").and_yield.and_return(response)

      expect(test_class.create_instance_snapshot("s1", "snap-1")).to eq(image_id: "img-7")
    end

    it "falls back to the newest image by name when no Location header is present" do
      response = double("response", header: {}, body: {})
      allow(elektron_nova).to receive(:post).with("servers/s1/action").and_yield.and_return(response)
      allow(test_class).to receive(:glance_images).with("name" => "snap-1").and_return([
        { "id" => "old", "created_at" => "2024-01-01T00:00:00Z" },
        { "id" => "new", "created_at" => "2024-06-01T00:00:00Z" },
      ])

      expect(test_class.create_instance_snapshot("s1", "snap-1")).to eq(image_id: "new")
    end

    it "raises RequestError on a blank name and makes no backend call" do
      expect(elektron_nova).not_to receive(:post)
      expect { test_class.create_instance_snapshot("s1", "  ") }.to raise_error(ComputeNjq::RequestError)
    end
  end

  describe "#find_image_status" do
    it "shapes the glance image to id/name/status" do
      allow(test_class).to receive(:glance_image).with("img-7").and_return(
        { "id" => "img-7", "name" => "snap-1", "status" => "saving", "extra" => "ignored" }
      )
      expect(test_class.find_image_status("img-7")).to eq(id: "img-7", name: "snap-1", status: "saving")
    end

    it "returns nil for a missing image" do
      allow(test_class).to receive(:glance_image).with("missing").and_return(nil)
      expect(test_class.find_image_status("missing")).to be_nil
    end
  end
end
