require "spec_helper"

describe Automation::Forms::Automation, :skip do
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
