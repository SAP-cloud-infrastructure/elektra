require "spec_helper"

describe Automation::Forms::Automation do
  skip "Temporarily skipping all tests in this file"
  
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
