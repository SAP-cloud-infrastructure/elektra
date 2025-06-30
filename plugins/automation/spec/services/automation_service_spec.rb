require "spec_helper"


RSpec.describe ServiceLayer::AutomationService do
  skip "Temporarily skipping all tests in this file"
  
  default_params = {
    domain_id: AuthenticationStub.domain_id,
    project_id: AuthenticationStub.project_id,
  }

  before :each do
    allow_any_instance_of(ServiceLayer::AutomationService).to receive(
      :automation_service_endpoint,
    ).and_return("automation_endpont")
  end

  describe "automations" do
    describe "collect_all" do
      it "should collect all" do
        automation_service = double("automation_service").as_null_object
        partial_collection1 =
          double(
            "partial_collection1",
            current_page: 1,
            total_pages: 5,
            elements: ["element1"],
          ).as_null_object
        partial_collection2 =
          double(
            "partial_collection2",
            current_page: 2,
            total_pages: 5,
            elements: ["element2"],
          ).as_null_object
        partial_collection3 =
          double(
            "partial_collection3",
            current_page: 3,
            total_pages: 5,
            elements: ["element3"],
          ).as_null_object
        partial_collection4 =
          double(
            "partial_collection4",
            current_page: 4,
            total_pages: 5,
            elements: ["element4"],
          ).as_null_object
        partial_collection5 =
          double(
            "partial_collection5",
            current_page: 5,
            total_pages: 5,
            elements: ["element5"],
          ).as_null_object

        allow(automation_service).to receive(:find).with(
          :all,
          {},
          { page: 1, per_page: 100 },
        ) { partial_collection1 }
        allow(automation_service).to receive(:find).with(
          :all,
          {},
          { page: 2, per_page: 100 },
        ) { partial_collection2 }
        allow(automation_service).to receive(:find).with(
          :all,
          {},
          { page: 3, per_page: 100 },
        ) { partial_collection3 }
        allow(automation_service).to receive(:find).with(
          :all,
          {},
          { page: 4, per_page: 100 },
        ) { partial_collection4 }
        allow(automation_service).to receive(:find).with(
          :all,
          {},
          { page: 5, per_page: 100 },
        ) { partial_collection5 }

        allow_any_instance_of(ServiceLayer::AutomationService).to receive(
          :automation_service,
        ).and_return(automation_service)

        service = ServiceLayer::AutomationService.new(nil)

        expect(service.automations_collect_all).to match(
          %w[element1 element2 element3 element4 element5],
        )
      end
    end
  end
end
