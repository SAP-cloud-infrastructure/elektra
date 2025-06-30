require "spec_helper"

describe Automation::Forms::NodeTags, :skip do
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
