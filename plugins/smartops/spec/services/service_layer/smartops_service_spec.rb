require 'spec_helper'

RSpec.describe ServiceLayer::SmartopsService do
  let(:elektron_mock) { double('elektron') }
  let(:service_instance) { described_class.new(elektron_mock) }

  before do
    allow(service_instance).to receive(:elektron).and_return(elektron_mock)
  end

  describe 'inheritance' do
    it 'inherits from Core::ServiceLayer::Service' do
      expect(described_class.superclass).to eq(Core::ServiceLayer::Service)
    end
  end

  describe '#available?' do
    context 'when smartops service is available' do
      before do
        allow(elektron_mock).to receive(:service?).with("smartops").and_return(true)
      end

      it 'returns true without action parameter' do
        expect(service_instance.available?).to be true
      end

      it 'returns true with action parameter' do
        expect(service_instance.available?(:list_jobs)).to be true
      end

      it 'returns true with nil action parameter' do
        expect(service_instance.available?(nil)).to be true
      end
    end

    context 'when smartops service is not available' do
      before do
        allow(elektron_mock).to receive(:service?).with("smartops").and_return(false)
      end

      it 'returns false without action parameter' do
        expect(service_instance.available?).to be false
      end

      it 'returns false with action parameter' do
        expect(service_instance.available?(:list_jobs)).to be false
      end

      it 'returns false with nil action parameter' do
        expect(service_instance.available?(nil)).to be false
      end
    end

    it 'calls elektron.service? with correct service name' do
      allow(elektron_mock).to receive(:service?).with("smartops").and_return(true)
      
      service_instance.available?
      
      expect(elektron_mock).to have_received(:service?).with("smartops")
    end

    it 'ignores the action parameter' do
      allow(elektron_mock).to receive(:service?).with("smartops").and_return(true)
      
      service_instance.available?(:any_action)
      
      expect(elektron_mock).to have_received(:service?).with("smartops")
    end
  end
end
