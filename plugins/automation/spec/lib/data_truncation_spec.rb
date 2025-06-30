require "spec_helper"
require_relative "../../lib/automation/data_truncation"

skip "Temporarily skipping controller spec" do
  RSpec.describe ::Automation::DataTruncation do
    it "should set the default values when no data" do
      dt = ::Automation::DataTruncation.new(nil)
      expect(dt.data_lines).to eq(1)
      expect(dt.data_truncated?).to eq(false)
      expect(dt.data_output).to eq(::Automation::DataTruncation::NO_DATA_FOUND)
    end

    it "should not truncate under the default truncation lines limit" do
      data = data_generation(::Automation::DataTruncation::LINES_TRUNCATION - 1)
      dt = ::Automation::DataTruncation.new(data)
      expect(dt.data_lines).to eq(
        ::Automation::DataTruncation::LINES_TRUNCATION - 1,
      )
      expect(dt.data_truncated?).to eq(false)
      expect(dt.data_output).to eq(data)
    end

    it "should truncate over the default truncation lines limit" do
      data = data_generation(::Automation::DataTruncation::LINES_TRUNCATION + 10)
      dt = ::Automation::DataTruncation.new(data)
      expect(dt.data_lines).to eq(
        ::Automation::DataTruncation::LINES_TRUNCATION + 10,
      )
      expect(dt.data_truncated?).to eq(true)
      expect(dt.data_output).to eq(
        data.lines.last(::Automation::DataTruncation::LINES_TRUNCATION).join,
      )
    end

    it "should prettify json" do
      data = '{"run_list": ["role[landscape]","recipe[ids::certificate]"]}'
      dt = ::Automation::DataTruncation.new(data)
      expect(dt.data_lines).to eq(6)
      expect(dt.data_truncated?).to eq(false)
      expect(dt.data_output).to eq(JSON.pretty_generate(JSON.parse(data)))
    end
  end

  def data_generation(lines)
    output = ""
    for i in 1..lines
      output << "Line #{i}\n"
    end
    output
  end
end