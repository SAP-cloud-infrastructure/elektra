require "spec_helper"

RSpec.describe SearchNodesService do
  skip "Temporarily skipping all tests in this file"
  
  describe "search_query" do
    it "retruns an empty string if no search text given" do
      expect(SearchNodesService.search_query("")).to eq("")
    end

    it "return the query" do
      expect(SearchNodesService.search_query("db")).to eq(
        "name ^ '*db*' OR @hostname ^ '*db*' OR @identity ^ '*db*'",
      )
    end

    it "should strip the query" do
      expect(SearchNodesService.search_query("  test  ")).to eq(
        "name ^ '*test*' OR @hostname ^ '*test*' OR @identity ^ '*test*'",
      )
    end

    it "should return an empty string if key value not defined as following key=value" do
      expect(SearchNodesService.search_query("name=")).to eq("")
      expect(SearchNodesService.search_query("=test")).to eq("")
    end

    it "return the advance query" do
      expect(SearchNodesService.search_query("name=web test")).to eq(
        "name ^ '*web test*' OR @name ^ '*web test*'",
      )
    end

    it "should remove key whitespaces and strip values when using advance search" do
      expect(
        SearchNodesService.search_query("   tag name =    web test   "),
      ).to eq("tagname ^ '*web test*' OR @tagname ^ '*web test*'")
    end
  end
end
