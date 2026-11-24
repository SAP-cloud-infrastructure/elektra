# frozen_string_literal: true
require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::ConsoleActions do
  let(:test_class) do
    Class.new { extend ServiceLayer::ComputeNjqServices::ConsoleActions }
  end

  def stub_server(hypervisor_type)
    flavor = hypervisor_type.nil? ? {} : { "extra_specs" => { "capabilities:hypervisor_type" => hypervisor_type } }
    allow(test_class).to receive(:nova_server).with("srv1").and_return({ "flavor" => flavor })
  end

  describe "#instance_console" do
    it "requests a vnc/novnc console for QEMU and returns url/type/protocol" do
      stub_server("QEMU")
      expect(test_class).to receive(:nova_remote_console).with("srv1", protocol: "vnc", type: "novnc").and_return(
        { "protocol" => "vnc", "type" => "novnc", "url" => "https://c.cloud.sap/vnc?token=x" },
      )
      expect(test_class.instance_console("srv1")).to eq(
        url: "https://c.cloud.sap/vnc?token=x", type: "novnc", protocol: "vnc",
      )
    end

    it "requests a serial console for Cloud Hypervisor (CH)" do
      stub_server("CH")
      expect(test_class).to receive(:nova_remote_console).with("srv1", protocol: "serial", type: "serial").and_return(
        { "protocol" => "serial", "type" => "serial", "url" => "https://c/serial" },
      )
      test_class.instance_console("srv1")
    end

    it "requests a webmks console for VMware" do
      stub_server("VMware vCenter Server")
      expect(test_class).to receive(:nova_remote_console).with("srv1", protocol: "mks", type: "webmks").and_return(
        { "protocol" => "mks", "type" => "webmks", "url" => "https://c/mks" },
      )
      test_class.instance_console("srv1")
    end

    it "requests a shellinabox serial console for ironic" do
      stub_server("ironic")
      expect(test_class).to receive(:nova_remote_console).with("srv1", protocol: "serial", type: "shellinabox").and_return(
        { "protocol" => "serial", "type" => "shellinabox", "url" => "https://c/sib" },
      )
      test_class.instance_console("srv1")
    end

    it "falls back to the Nova default (mks/webmks) when the hypervisor is unknown or missing" do
      stub_server(nil)
      expect(test_class).to receive(:nova_remote_console).with("srv1", protocol: "mks", type: "webmks").and_return(
        { "protocol" => "mks", "type" => "webmks", "url" => "https://c/default" },
      )
      test_class.instance_console("srv1")
    end
  end
end
