# frozen_string_literal: true
require "spec_helper"

describe Compute::Forms::ConfirmHardReset do
  it "is valid when the typed name matches the instance name" do
    form =
      described_class.new(name: "my-instance", instance_name: "my-instance")
    expect(form.validate).to be(true)
    expect(form.errors[:name]).to be_empty
  end

  it "is invalid when the typed name does not match the instance name" do
    form =
      described_class.new(name: "wrong-name", instance_name: "my-instance")
    expect(form.validate).to be(false)
    expect(form.errors[:name]).to include("not correct!")
  end

  it "is invalid when the name is blank" do
    form = described_class.new(name: "", instance_name: "my-instance")
    expect(form.validate).to be(false)
    expect(form.errors[:name]).not_to be_empty
  end
end
