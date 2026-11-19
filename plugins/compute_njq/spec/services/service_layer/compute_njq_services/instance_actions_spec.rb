# frozen_string_literal: true

require "spec_helper"

RSpec.describe ServiceLayer::ComputeNjqServices::InstanceActions do
  let(:test_class) do
    Class.new do
      extend ServiceLayer::ComputeNjqServices::InstanceActions
    end
  end

  describe "#instance_action" do
    it "maps stop to the os-stop body" do
      expect(test_class).to receive(:nova_server_action).with("s1", { "os-stop" => nil })
      test_class.instance_action("s1", "stop")
    end

    it "maps reboot to a SOFT reboot" do
      expect(test_class).to receive(:nova_server_action).with("s1", { "reboot" => { "type" => "SOFT" } })
      test_class.instance_action("s1", "reboot")
    end

    it "maps hard_reset to a HARD reboot" do
      expect(test_class).to receive(:nova_server_action).with("s1", { "reboot" => { "type" => "HARD" } })
      test_class.instance_action("s1", "hard_reset")
    end

    it "maps pause and suspend to their bodies" do
      expect(test_class).to receive(:nova_server_action).with("s1", { "pause" => nil })
      test_class.instance_action("s1", "pause")
      expect(test_class).to receive(:nova_server_action).with("s1", { "suspend" => nil })
      test_class.instance_action("s1", "suspend")
    end

    context "start branching on current status" do
      it "uses os-start for a stopped server" do
        allow(test_class).to receive(:nova_server).with("s1").and_return({ "status" => "SHUTOFF" })
        expect(test_class).to receive(:nova_server_action).with("s1", { "os-start" => nil })
        test_class.instance_action("s1", "start")
      end

      it "uses unpause for a paused server" do
        allow(test_class).to receive(:nova_server).with("s1").and_return({ "status" => "PAUSED" })
        expect(test_class).to receive(:nova_server_action).with("s1", { "unpause" => nil })
        test_class.instance_action("s1", "start")
      end

      it "uses resume for a suspended server" do
        allow(test_class).to receive(:nova_server).with("s1").and_return({ "status" => "SUSPENDED" })
        expect(test_class).to receive(:nova_server_action).with("s1", { "resume" => nil })
        test_class.instance_action("s1", "start")
      end
    end

    it "runs the two-step lock sequence (metadata then lock)" do
      expect(test_class).to receive(:nova_set_locked_metadata).with("s1", "true").ordered
      expect(test_class).to receive(:nova_server_action).with("s1", { "lock" => nil }).ordered
      test_class.instance_action("s1", "lock")
    end

    it "runs the two-step unlock sequence (unlock then metadata)" do
      expect(test_class).to receive(:nova_server_action).with("s1", { "unlock" => nil }).ordered
      expect(test_class).to receive(:nova_set_locked_metadata).with("s1", "false").ordered
      test_class.instance_action("s1", "unlock")
    end

    it "returns { ok: true } on success" do
      allow(test_class).to receive(:nova_server_action)
      expect(test_class.instance_action("s1", "stop")).to eq({ ok: true })
    end

    it "rejects an unknown action without calling Nova" do
      expect(test_class).not_to receive(:nova_server_action)
      expect { test_class.instance_action("s1", "destroy_everything") }
        .to raise_error(ComputeNjq::RequestError, /Unknown instance action/)
    end
  end

  describe "#terminate_instance" do
    it "deletes the server and returns { ok: true }" do
      expect(test_class).to receive(:nova_delete_server).with("s1")
      expect(test_class.terminate_instance("s1")).to eq({ ok: true })
    end
  end

  describe "#update_instance" do
    it "renames the server via nova_update_server" do
      expect(test_class).to receive(:nova_update_server).with("s1", { "name" => "web-02" })
      expect(test_class.update_instance("s1", "web-02")).to eq({ ok: true })
    end

    it "strips surrounding whitespace before renaming" do
      expect(test_class).to receive(:nova_update_server).with("s1", { "name" => "web-02" })
      test_class.update_instance("s1", "  web-02  ")
    end

    it "raises when the name is blank" do
      expect { test_class.update_instance("s1", "  ") }.to raise_error(ComputeNjq::RequestError)
    end
  end

  describe "#set_instance_tags" do
    it "replaces the whole tag set via nova_set_server_tags" do
      expect(test_class).to receive(:nova_set_server_tags).with("s1", %w[web prod])
      expect(test_class.set_instance_tags("s1", %w[web prod])).to eq({ ok: true })
    end

    it "trims, drops blanks, and dedupes" do
      expect(test_class).to receive(:nova_set_server_tags).with("s1", %w[web prod])
      test_class.set_instance_tags("s1", [" web ", "web", "", "prod"])
    end

    it "allows clearing all tags with an empty list" do
      expect(test_class).to receive(:nova_set_server_tags).with("s1", [])
      test_class.set_instance_tags("s1", [])
    end
  end

  describe "#reset_instance_status" do
    it "resets to active via os-resetState" do
      expect(test_class).to receive(:nova_server_action).with("s1", { "os-resetState" => { "state" => "active" } })
      expect(test_class.reset_instance_status("s1", "active")).to eq({ ok: true })
    end

    it "resets to error via os-resetState" do
      expect(test_class).to receive(:nova_server_action).with("s1", { "os-resetState" => { "state" => "error" } })
      test_class.reset_instance_status("s1", "error")
    end

    it "rejects any state other than active/error" do
      expect(test_class).not_to receive(:nova_server_action)
      expect { test_class.reset_instance_status("s1", "deleted") }.to raise_error(ComputeNjq::RequestError)
    end
  end

  describe "#resize_instance" do
    it "posts an os-resize with the flavorRef and returns ok" do
      expect(test_class).to receive(:nova_server_action).with("s1", { "resize" => { "flavorRef" => "f2" } })
      expect(test_class.resize_instance("s1", "f2")).to eq({ ok: true })
    end

    it "trims the flavor id" do
      expect(test_class).to receive(:nova_server_action).with("s1", { "resize" => { "flavorRef" => "f2" } })
      test_class.resize_instance("s1", "  f2  ")
    end

    it "rejects a blank flavor without calling Nova" do
      expect(test_class).not_to receive(:nova_server_action)
      expect { test_class.resize_instance("s1", "  ") }.to raise_error(ComputeNjq::RequestError)
      expect { test_class.resize_instance("s1", nil) }.to raise_error(ComputeNjq::RequestError)
    end
  end

  describe "#instance_action resize follow-ups" do
    it "maps confirm_resize to confirmResize" do
      expect(test_class).to receive(:nova_server_action).with("s1", { "confirmResize" => nil })
      expect(test_class.instance_action("s1", "confirm_resize")).to eq({ ok: true })
    end

    it "maps revert_resize to revertResize" do
      expect(test_class).to receive(:nova_server_action).with("s1", { "revertResize" => nil })
      expect(test_class.instance_action("s1", "revert_resize")).to eq({ ok: true })
    end
  end
end
