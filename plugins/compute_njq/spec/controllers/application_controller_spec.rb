# frozen_string_literal: true

require "spec_helper"

RSpec.describe ComputeNjq::ApplicationController, type: :controller do
  describe "#quota_project" do
    it "maps to the compute Limes category (not compute_njq)" do
      expect(controller.send(:quota_project)).to eq("compute")
    end
  end

  describe "#load_help_text" do
    # The core Dashboard#load_help_text resolves the plugin dir via
    # controller_path.starts_with?(plugin.name), which wrongly matches
    # "compute" before "compute_njq". The override must load help from THIS
    # plugin's own directory.
    let(:plugin_path) { Core::PluginsManager.plugin("compute_njq").path }

    before { controller.instance_variable_set(:@domain_config, nil) }

    it "loads the help text from the compute_njq plugin directory" do
      controller.send(:load_help_text)
      expect(controller.instance_variable_get(:@plugin_help_text)).to include("Servers")
    end

    it "loads internal help links and interpolates the docu url when not hidden" do
      allow(controller).to receive(:sap_url_for).with("documentation").and_return("https://docs.example/")
      controller.send(:load_help_text)
      links = controller.instance_variable_get(:@plugin_help_links)
      expect(links).to include("Compute Documentation")
      expect(links).not_to include('#{@sap_docu_url}')
    end

    it "loads external help links when internal links are hidden" do
      domain_config = double("domain_config")
      allow(domain_config).to receive(:feature_hidden?).with("internal_help_links").and_return(true)
      controller.instance_variable_set(:@domain_config, domain_config)

      controller.send(:load_help_text)
      expect(controller.instance_variable_get(:@plugin_help_links)).to include("OS CLI to handle servers")
    end

    it "resolves to the compute_njq directory, not the compute plugin" do
      expect(plugin_path).to end_with("plugins/compute_njq")
    end
  end
end
