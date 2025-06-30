require "spec_helper"

skip "Temporarily skipping controller spec" do
  describe Automation::Forms::Automation do
    it "should trim the attributes" do
      automation =
        Automation::Forms::Automation.new(
          { "name" => " test a", "path" => "  test b  " },
        )
      automation.valid?
      expect(automation.name).to eq("test a")
      expect(automation.path).to eq("test b")
    end
  end
end
