module Resources
  class V2Controller < DashboardController
    helper_method :resource_documentation_links

    def project; end
    def domain; end
    def cluster; end

    private

    def resource_documentation_links
      {
        "share_replication" => "https://documentation.global.cloud.sap/docs/customer/storage/file-storage/fs-howto/filestore-create-a-share-replica/",
        "convert_commitments" => "https://documentation.global.cloud.sap/docs/customer/monitoring/quota-management/convert-resources/"
      }
    end
  end
end
