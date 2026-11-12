# frozen_string_literal: true

require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::Thanos do
  let(:test_class) do
    Class.new do
      extend ServiceLayer::ComputeNjqServices::Thanos
      def self.scoped_region = "qa-de-1"
    end
  end

  def stub_thanos(result)
    response = instance_double(Net::HTTPOK, body: { "data" => { "result" => result } }.to_json)
    allow(response).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
    allow(Net::HTTP).to receive(:get_response).and_return(response)
  end

  describe "#thanos_cpu_recommendation" do
    it "returns the scalar recommendation when present" do
      stub_thanos([{ "value" => [1_700_000_000, "4"] }])
      expect(test_class.thanos_cpu_recommendation("s1")).to eq("4")
    end

    it "returns nil when there is no result (sizing is OK)" do
      stub_thanos([])
      expect(test_class.thanos_cpu_recommendation("s1")).to be_nil
    end
  end

  describe "#thanos_memory_recommendation" do
    it "rounds the recommendation to two decimals" do
      stub_thanos([{ "value" => [1_700_000_000, "8.123456"] }])
      expect(test_class.thanos_memory_recommendation("s1")).to eq(8.12)
    end

    it "returns nil when sizing is OK" do
      stub_thanos([])
      expect(test_class.thanos_memory_recommendation("s1")).to be_nil
    end
  end

  describe "#thanos_guest_tools" do
    it "reports not_found when there is no installed version" do
      stub_thanos([])
      expect(test_class.thanos_guest_tools("s1")).to be_nil
    end

    it "reports outdated when the installed version is below target" do
      allow(test_class).to receive(:thanos_metric_field).with(anything, "guest_tools_target_version").and_return("12.1.0")
      allow(test_class).to receive(:thanos_metric_field).with(anything, "guest_tools_version").and_return("12.0.5")
      expect(test_class.thanos_guest_tools("s1")).to eq(
        installed: "12.0.5", target: "12.1.0", state: "outdated",
      )
    end

    it "reports up_to_date when installed meets or exceeds target" do
      allow(test_class).to receive(:thanos_metric_field).with(anything, "guest_tools_target_version").and_return("12.0.0")
      allow(test_class).to receive(:thanos_metric_field).with(anything, "guest_tools_version").and_return("12.0.0")
      expect(test_class.thanos_guest_tools("s1")[:state]).to eq("up_to_date")
    end

    it "treats an installed version of 0 as not found" do
      allow(test_class).to receive(:thanos_metric_field).with(anything, "guest_tools_target_version").and_return("12.0.0")
      allow(test_class).to receive(:thanos_metric_field).with(anything, "guest_tools_version").and_return("0")
      expect(test_class.thanos_guest_tools("s1")).to be_nil
    end
  end

  describe "region interpolation" do
    it "targets the scoped region's Thanos host" do
      stub_thanos([])
      test_class.thanos_cpu_recommendation("s1")
      expect(Net::HTTP).to have_received(:get_response) do |uri|
        expect(uri.host).to eq("thanos-internal-scaleout.qa-de-1.cloud.sap")
      end
    end
  end
end
