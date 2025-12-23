require 'spec_helper'
RSpec.describe Smartops::Api::JobsController, type: :controller do
  routes { Smartops::Engine.routes }
  let(:smartops_service) { double('smartops_service') }
  let(:services_mock) { double('services', smartops: smartops_service) }
  default_params = {
    # AuthenticationStub comes from monsoon openstack auth
    domain_id: AuthenticationStub.domain_id,
    project_id: AuthenticationStub.project_id,
  }
  
  before(:all) do
    FriendlyIdEntry.find_or_create_entry(
      "Domain",
      nil,
      default_params[:domain_id],
      "default",
    )
    FriendlyIdEntry.find_or_create_entry(
      "Project",
      default_params[:domain_id],
      default_params[:project_id],
      default_params[:project_id],
    )
  end
  
  before do
    # comes from monsoon openstack auth
    stub_authentication
    allow(controller).to receive(:services).and_return(services_mock)
    controller.instance_variable_set(:@scoped_project_id, 'project_123')
  end
  
  describe 'GET #index' do
    context 'when successful' do
      let(:mock_jobs) { [{ id: 'job_001', name: 'Test Job' }, { id: 'job_002', name: 'Another Job' }] }
      
      before do
        allow(smartops_service).to receive(:list_jobs).and_return(mock_jobs)
      end
      
      it 'returns jobs successfully' do
        get :index, params: default_params
        
        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response).to eq({
          'success' => true,
          'jobs' => [
            { 'id' => 'job_001', 'name' => 'Test Job' },
            { 'id' => 'job_002', 'name' => 'Another Job' }
          ]
        })
      end
      
      it 'calls list_jobs with empty filter when no filter params provided' do
        get :index, params: default_params
       
        expect(smartops_service).to have_received(:list_jobs).with({})
      end
      
      it 'passes additional filter parameters when provided' do
        get :index, params: default_params.merge(name: 'backup', type: 'server', scheduled_date: '2024-01-15T10:00:00Z')
        expect(smartops_service).to have_received(:list_jobs).with({
          name: 'backup',
          type: 'server',
          scheduled_date: '2024-01-15T10:00:00Z'
        })
      end
      
      it 'ignores empty filter parameters' do
        get :index, params: default_params.merge(name: '', type: nil, id: '   ')
        
        expect(smartops_service).to have_received(:list_jobs).with({})
      end
      
      it 'handles all possible filter parameters' do
        get :index, params: default_params.merge(
          name: 'test',
          type: 'server',
          id: 'job_001',
          scheduled_date: '2024-01-15T10:00:00Z',
          due_date: '2024-01-16T10:00:00Z'
        )
        
        expect(smartops_service).to have_received(:list_jobs).with({
          name: 'test',
          type: 'server',
          id: 'job_001',
          scheduled_date: '2024-01-15T10:00:00Z',
          due_date: '2024-01-16T10:00:00Z'
        })
      end
    end
    
    context 'when error occurs' do
      before do
        allow(smartops_service).to receive(:list_jobs).and_raise(StandardError.new('Service unavailable'))
      end
      
      it 'returns API error with bad request status' do
        get :index, params: default_params
        
        expect(response).to have_http_status(:bad_request)
        json_response = JSON.parse(response.body)
        
        expect(json_response['success']).to be false
        expect(json_response['error']['type']).to eq('API_ERROR')
        expect(json_response['error']['message']).to eq('Service unavailable')
        expect(json_response['error']['backtrace']).to be_an(Array)
      end
      
      it 'includes backtrace in non-production environment' do
        allow(Rails.env).to receive(:production?).and_return(false)
        
        get :index, params: default_params
        
        json_response = JSON.parse(response.body)
        expect(json_response['error']['backtrace']).to be_an(Array)
        expect(json_response['error']['backtrace']).not_to be_empty
      end
      
      it 'excludes backtrace in production environment' do
        allow(Rails.env).to receive(:production?).and_return(true)
        
        get :index, params: default_params
        
        json_response = JSON.parse(response.body)
        expect(json_response['error']['backtrace']).to eq([])
      end
    end

  end
  
  describe 'PUT #update' do
    context 'when successful' do
      before do
        allow(smartops_service).to receive(:schedule_job).and_return(true)
      end
      
      it 'updates job successfully' do
        put :update, params: default_params.merge(id: 'job_001', schedule_date: '2024-02-01T10:00:00Z')
        
        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response).to eq({
          'success' => true
        })
      end
      
      it 'calls service with correct parameters' do
        put :update, params: default_params.merge(id: 'job_001', schedule_date: '2024-02-01T10:00:00Z')
        
        expect(smartops_service).to have_received(:schedule_job).with(
          'job_001',
          '2024-02-01T10:00:00Z'
        )
      end
    end
    
    context 'when required parameters are missing' do

      context 'when required parameters are missing' do
        it 'returns error response for missing schedule_date' do
          put :update, params: default_params.merge(id: 'job_001')
          
          expect(response).to have_http_status(:bad_request)
          json_response = JSON.parse(response.body)
          
          expect(json_response['success']).to be false
          expect(json_response['error']['type']).to eq('API_ERROR')
          expect(json_response['error']['message']).to match(/schedule_date/)
        end
      end
    end
    
    context 'when service error occurs' do
      before do
        allow(smartops_service).to receive(:schedule_job).and_raise(StandardError.new('Job not found'))
      end
      
      it 'returns API error' do
        put :update, params: default_params.merge(id: 'job_001', schedule_date: '2024-02-01T10:00:00Z')
        
        expect(response).to have_http_status(:bad_request)
        json_response = JSON.parse(response.body)
        
        expect(json_response['success']).to be false
        expect(json_response['error']['type']).to eq('API_ERROR')
        expect(json_response['error']['message']).to eq('Job not found')
        expect(json_response['error']['backtrace']).to be_an(Array)
      end
    end
  end
  
  describe 'GET #show' do
    context 'when job exists' do
      let(:mock_jobs) { [{ id: 'job_001', name: 'Test Job', state: 'running' }] }
      
      before do
        allow(smartops_service).to receive(:list_jobs).and_return(mock_jobs)
      end
      
      it 'returns the job successfully' do
        get :show, params: default_params.merge(id: 'job_001')
        
        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response).to eq({
          'success' => true,
          'job' => {
            'id' => 'job_001',
            'name' => 'Test Job',
            'state' => 'running'
          }
        })
      end
      
      it 'calls service with id filter' do
        get :show, params: default_params.merge(id: 'job_001')
        
        expect(smartops_service).to have_received(:list_jobs).with(id: 'job_001')
      end
    end
    
    context 'when job does not exist (empty result)' do
      before do
        allow(smartops_service).to receive(:list_jobs).and_return([])
      end
      
      it 'returns nil job' do
        get :show, params: default_params.merge(id: 'nonexistent_job')
        
        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response).to eq({
          'success' => true,
          'job' => nil
        })
      end
    end
    
    context 'when service error occurs' do
      before do
        allow(smartops_service).to receive(:list_jobs).and_raise(StandardError.new('Service timeout'))
      end
      
      it 'returns API error' do
        get :show, params: default_params.merge(id: 'job_001')
        
        expect(response).to have_http_status(:bad_request)
        json_response = JSON.parse(response.body)
        
        expect(json_response['success']).to be false
        expect(json_response['error']['type']).to eq('API_ERROR')
        expect(json_response['error']['message']).to eq('Service timeout')
        expect(json_response['error']['backtrace']).to be_an(Array)
      end
    end
  end

  describe '#build_filter_params' do
    it 'returns empty hash when no filter parameters provided' do
      allow(smartops_service).to receive(:list_jobs).and_return([])
      
      get :index, params: default_params
      expect(smartops_service).to have_received(:list_jobs).with({})
    end
    
    it 'handles mixed present and blank parameters' do
      allow(smartops_service).to receive(:list_jobs).and_return([])
      
      get :index, params: default_params.merge(
        name: 'test', 
        type: '', 
        id: 'job_001', 
        scheduled_date: nil,
        due_date: '2024-01-15T10:00:00Z'
      )
      
      expect(smartops_service).to have_received(:list_jobs).with({
        name: 'test',
        id: 'job_001',
        due_date: '2024-01-15T10:00:00Z'
      })
    end
  end
  
  describe 'error handling behavior' do
    context 'different types of errors' do
      it 'handles RuntimeError' do
        allow(smartops_service).to receive(:list_jobs).and_raise(RuntimeError.new('Runtime error'))
        
        get :index, params: default_params
        
        expect(response).to have_http_status(:bad_request)
        json_response = JSON.parse(response.body)
        expect(json_response['error']['message']).to eq('Runtime error')
      end
      
      it 'handles ArgumentError' do
        allow(smartops_service).to receive(:list_jobs).and_raise(ArgumentError.new('Invalid argument'))
        
        get :index, params: default_params
        
        expect(response).to have_http_status(:bad_request)
        json_response = JSON.parse(response.body)
        expect(json_response['error']['message']).to eq('Invalid argument')
      end
      
      it 'handles custom errors' do
        custom_error = Class.new(StandardError)
        allow(smartops_service).to receive(:list_jobs).and_raise(custom_error.new('Custom error'))
        
        get :index, params: default_params
        
        expect(response).to have_http_status(:bad_request)
        json_response = JSON.parse(response.body)
        expect(json_response['error']['message']).to eq('Custom error')
      end
    end
    
    it 'always returns consistent error structure' do
      allow(smartops_service).to receive(:list_jobs).and_raise(StandardError.new('Test error'))
      
      get :index, params: default_params
      
      json_response = JSON.parse(response.body)
      expect(json_response).to have_key('success')
      expect(json_response).to have_key('error')
      expect(json_response['success']).to be false
      expect(json_response['error']).to have_key('type')
      expect(json_response['error']).to have_key('message')
      expect(json_response['error']).to have_key('backtrace')
      expect(json_response['error']['type']).to eq('API_ERROR')
    end
  end
end