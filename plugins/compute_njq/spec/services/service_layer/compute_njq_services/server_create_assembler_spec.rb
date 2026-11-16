# frozen_string_literal: true
require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::ServerCreateAssembler do
  let(:test_class) do
    Class.new do
      extend ServiceLayer::ComputeNjqServices::ServerCreateAssembler
    end
  end

  let(:valid_attrs) do
    {
      "name" => "web-01",
      "flavor_id" => "f1",
      "image_id" => "i1",
      "keypair" => "my-key",
      "availability_zone" => "az-1",
      "network_id" => "n1",
      "security_groups" => ["default"],
      "user_data" => "hello",
    }
  end

  describe "#create_instance" do
    it "builds the Nova payload and posts it, returning the UI-shaped instance" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end
      allow(test_class).to receive(:find_instance).with("s1").and_return({ id: "s1", name: "web-01" })

      result = test_class.create_instance(valid_attrs)

      expect(result).to eq({ id: "s1", name: "web-01" })
      expect(captured["name"]).to eq("web-01")
      expect(captured["flavorRef"]).to eq("f1")
      expect(captured["imageRef"]).to eq("i1")
      expect(captured["key_name"]).to eq("my-key")
      expect(captured["availability_zone"]).to eq("az-1")
      expect(captured["max_count"]).to eq(1)
      expect(captured["min_count"]).to eq(1)
      expect(captured["security_groups"]).to eq([{ "name" => "default" }])
      expect(captured["networks"]).to eq([{ "uuid" => "n1" }])
    end

    it "returns the UI-shaped instance from find_instance (B2 regression guard)" do
      allow(test_class).to receive(:nova_create_server).and_return({ "id" => "s1" })
      shaped = { id: "s1", name: "web-01", status: { state: "active", transition: nil } }
      allow(test_class).to receive(:find_instance).with("s1").and_return(shaped)

      result = test_class.create_instance(valid_attrs)
      expect(result).to eq(shaped)
    end

    it "base64-encodes user_data exactly once" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end
      allow(test_class).to receive(:find_instance).with("s1").and_return({ id: "s1" })

      test_class.create_instance(valid_attrs)
      expect(captured["user_data"]).to eq(Base64.strict_encode64("hello"))
    end

    it "omits user_data when blank" do
      captured = nil
      allow(test_class).to receive(:nova_create_server) do |payload|
        captured = payload
        { "id" => "s1" }
      end
      allow(test_class).to receive(:find_instance).with("s1").and_return({ id: "s1" })

      test_class.create_instance(valid_attrs.merge("user_data" => ""))
      expect(captured).not_to have_key("user_data")
    end

    it "raises RequestError when a required field is missing" do
      expect { test_class.create_instance(valid_attrs.merge("flavor_id" => "")) }
        .to raise_error(ComputeNjq::RequestError, /flavor/)
    end

    it "rejects a name ending in dot+number" do
      expect { test_class.create_instance(valid_attrs.merge("name" => "web.1")) }
        .to raise_error(ComputeNjq::RequestError, /name/)
    end
  end
end
