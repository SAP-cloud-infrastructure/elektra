module Core
  class StaticConfig
    def self.regions
      @regions ||= load_regions
    end

    protected

    # only gets invoked once
    def self.load_regions
      JSON.parse(File.read(File.join(Rails.root, "config", "regions.json")))
    end
  end
end
