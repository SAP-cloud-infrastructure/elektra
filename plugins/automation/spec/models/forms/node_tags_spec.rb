require "spec_helper"

describe Automation::Forms::NodeTags do
  skip "Temporarily skipping all tests in this file"
  it "should trim the attributes" do
    node_tags =
      Automation::Forms::NodeTags.new(
        { "agent_id" => " some_id ", "tags" => "  tag1,tag2  " },
      )
    node_tags.valid?
    expect(node_tags.agent_id).to eq("some_id")
    expect(node_tags.tags).to eq("tag1,tag2")
  end
end
