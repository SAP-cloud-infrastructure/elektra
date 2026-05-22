# frozen_string_literal: true
require "spec_helper"

# Tests for the locked? helper on Compute::Server and for the action menu
# lock/unlock visibility fix (issue #1666).
#
# Issue #1666: "Lock" option was still visible in the action menu for already
# locked server instances. The fix ensures:
#   - "Lock" is only shown when the server is NOT locked
#   - "Unlock" is only shown when the server IS locked

describe Compute::Server do
  # Helper to build a server with specific locked-related attributes.
  # The locked? method checks metadata.locked and/or the top-level locked attribute.
  def build_server(attrs = {})
    Compute::Server.new(nil, attrs)
  end

  # ---------------------------------------------------------------------------
  # locked? — unit tests
  # ---------------------------------------------------------------------------
  describe "#locked?" do
    context "when server is NOT locked (various falsy forms)" do
      it "returns false when neither metadata nor top-level locked attribute is set" do
        server = build_server({})
        expect(server.locked?).to be_falsy
      end

      it "returns false when metadata.locked is false (boolean)" do
        # We pass metadata as a hash; the model should expose it as an object
        server = build_server("metadata" => { "locked" => false })
        expect(server.locked?).to be_falsy
      end

      it "returns false when metadata.locked is the string 'false'" do
        server = build_server("metadata" => { "locked" => "false" })
        expect(server.locked?).to be_falsy
      end

      it "returns false when metadata.locked is nil" do
        server = build_server("metadata" => { "locked" => nil })
        expect(server.locked?).to be_falsy
      end

      it "returns false when top-level locked is false (boolean)" do
        server = build_server("locked" => false)
        expect(server.locked?).to be_falsy
      end

      it "returns false when top-level locked is the string 'false'" do
        server = build_server("locked" => "false")
        expect(server.locked?).to be_falsy
      end
    end

    context "when server IS locked (various truthy forms)" do
      it "returns true when metadata.locked is true (boolean)" do
        server = build_server("metadata" => { "locked" => true })
        expect(server.locked?).to be_truthy
      end

      it "returns true when metadata.locked is the string 'true'" do
        server = build_server("metadata" => { "locked" => "true" })
        expect(server.locked?).to be_truthy
      end

      it "returns true when top-level locked is true (boolean)" do
        server = build_server("locked" => true)
        expect(server.locked?).to be_truthy
      end

      it "returns true when top-level locked is the string 'true'" do
        server = build_server("locked" => "true")
        expect(server.locked?).to be_truthy
      end

      it "returns true when BOTH metadata.locked and top-level locked are true" do
        server = build_server("locked" => true, "metadata" => { "locked" => true })
        expect(server.locked?).to be_truthy
      end
    end

    context "edge cases" do
      it "responds to locked? as a public method" do
        server = build_server({})
        expect(server).to respond_to(:locked?)
      end

      it "locked? is consistent — calling it multiple times returns the same value" do
        server = build_server("metadata" => { "locked" => "true" })
        expect(server.locked?).to eq(server.locked?)
      end
    end
  end

  # ---------------------------------------------------------------------------
  # Lock action menu visibility logic (regression for issue #1666)
  #
  # The fix in _item_actions.html.haml ensures:
  #   - Lock link is only rendered when !instance.locked?
  #   - Unlock link is only rendered when instance.locked?
  #
  # These tests document the correct behaviour that the view template must
  # enforce. They use server instances to verify the model state on which the
  # view makes its conditional rendering decisions.
  # ---------------------------------------------------------------------------
  describe "action menu visibility (issue #1666 regression)" do
    context "when instance is NOT locked" do
      let(:unlocked_server) { build_server("metadata" => { "locked" => "false" }) }

      it "is NOT locked (Lock option should be shown)" do
        expect(unlocked_server.locked?).to be_falsy
      end

      it "Lock menu item should be shown: !instance.locked? is true" do
        # The view shows Lock when !instance.locked? — verify the condition
        show_lock = !unlocked_server.locked?
        expect(show_lock).to be_truthy
      end

      it "Unlock menu item should be hidden: instance.locked? is false" do
        # The view shows Unlock when instance.locked? — verify the condition
        show_unlock = unlocked_server.locked?
        expect(show_unlock).to be_falsy
      end
    end

    context "when instance IS locked" do
      let(:locked_server) { build_server("metadata" => { "locked" => "true" }) }

      it "IS locked (Unlock option should be shown)" do
        expect(locked_server.locked?).to be_truthy
      end

      it "Lock menu item should be hidden: !instance.locked? is false" do
        # The view shows Lock when !instance.locked? — verify the condition
        show_lock = !locked_server.locked?
        expect(show_lock).to be_falsy
      end

      it "Unlock menu item should be shown: instance.locked? is true" do
        # The view shows Unlock when instance.locked? — verify the condition
        show_unlock = locked_server.locked?
        expect(show_unlock).to be_truthy
      end
    end

    context "mutual exclusivity — Lock and Unlock are never both shown" do
      it "for a locked server: exactly one of Lock/Unlock is shown (Unlock)" do
        server = build_server("locked" => true)
        show_lock   = !server.locked?
        show_unlock = server.locked?
        # Only one can be true at a time — they are mutually exclusive
        expect([show_lock, show_unlock].count(true)).to eq(1)
        expect(show_unlock).to be_truthy
        expect(show_lock).to be_falsy
      end

      it "for an unlocked server: exactly one of Lock/Unlock is shown (Lock)" do
        server = build_server("locked" => false)
        show_lock   = !server.locked?
        show_unlock = server.locked?
        expect([show_lock, show_unlock].count(true)).to eq(1)
        expect(show_lock).to be_truthy
        expect(show_unlock).to be_falsy
      end

      it "the conditions are always complementary regardless of locked state" do
        [true, "true", false, "false", nil].each do |val|
          attrs = val.nil? ? {} : { "locked" => val }
          server = build_server(attrs)
          show_lock   = !server.locked?
          show_unlock = server.locked?
          # show_lock and show_unlock must be logical complements
          expect(show_lock).not_to eq(show_unlock),
            "For locked=#{val.inspect}: expected show_lock(#{show_lock}) != show_unlock(#{show_unlock})"
        end
      end
    end

    context "metadata vs top-level locked attribute" do
      it "prefers metadata.locked=true over top-level locked=false" do
        server = build_server("locked" => false, "metadata" => { "locked" => true })
        # metadata.locked takes effect via the OR condition in locked?
        expect(server.locked?).to be_truthy
      end

      it "returns true when top-level locked=true even if metadata not set" do
        server = build_server("locked" => true)
        expect(server.locked?).to be_truthy
      end

      it "returns true when metadata.locked='true' and top-level locked not set" do
        server = build_server("metadata" => { "locked" => "true" })
        expect(server.locked?).to be_truthy
      end
    end
  end
end
