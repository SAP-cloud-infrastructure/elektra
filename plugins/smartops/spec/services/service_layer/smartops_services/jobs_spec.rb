require 'spec_helper'

RSpec.describe ServiceLayer::SmartopsServices::Jobs do
  let(:test_class) { Class.new { extend ServiceLayer::SmartopsServices::Jobs } }
  
  let(:mock_jobs_data) do
    [
      {
        "id" => "job_001",
        "created_at" => "2024-01-15T08:30:00Z",
        "name" => "Server Backup - Production DB",
        "policy" => "daily_backup",
        "description" => "Daily backup of production database server including all user data and system configurations",
        "state" => "successful",
        "schedule_date" => "2024-01-15T23:00:00Z",
        "due_date" => "2024-01-16T06:00:00Z",
        "object_type" => "server",
        "object_id" => "srv_prod_db_001"
      },
      {
        "id" => "job_002",
        "created_at" => "2024-01-15T09:15:00Z",
        "name" => "Network Security Scan",
        "policy" => "weekly_security_scan",
        "description" => "Comprehensive security vulnerability scan of the corporate network infrastructure",
        "state" => "running",
        "schedule_date" => "2024-01-15T10:00:00Z",
        "due_date" => "2024-01-15T14:00:00Z",
        "object_type" => "network",
        "object_id" => "net_corp_main"
      },
      {
        "id" => "job_003",
        "created_at" => "2024-01-15T07:45:00Z",
        "name" => "Web Server Maintenance",
        "policy" => "monthly_maintenance",
        "description" => "Routine maintenance including system updates, log rotation, and performance optimization",
        "state" => "scheduled",
        "schedule_date" => "2024-01-20T02:00:00Z",
        "due_date" => "2024-01-20T05:00:00Z",
        "object_type" => "server",
        "object_id" => "srv_web_001"
      },
      {
        "id" => "job_004",
        "created_at" => "2024-01-15T11:20:00Z",
        "name" => "Load Balancer Configuration Update",
        "policy" => "on_demand",
        "description" => "Update load balancer configuration to handle increased traffic during peak hours",
        "state" => "pending",
        "schedule_date" => "2024-01-15T18:00:00Z",
        "due_date" => "2024-01-15T20:00:00Z",
        "object_type" => "network",
        "object_id" => "net_lb_cluster_01"
      },
      {
        "id" => "job_005",
        "created_at" => "2024-01-15T06:30:00Z",
        "name" => "Application Server Restart",
        "policy" => "emergency_restart",
        "description" => "Emergency restart of application server due to memory leak detection",
        "state" => "failed",
        "schedule_date" => "2024-01-15T07:00:00Z",
        "due_date" => "2024-01-15T07:30:00Z",
        "object_type" => "server",
        "object_id" => "srv_app_003"
      },
      {
        "id" => "job_006",
        "created_at" => "2024-01-15T12:00:00Z",
        "name" => "Firewall Rule Update",
        "policy" => "security_update",
        "description" => "Update firewall rules to block newly identified malicious IP ranges",
        "state" => "waiting",
        "schedule_date" => "2024-01-15T16:00:00Z",
        "due_date" => "2024-01-15T17:00:00Z",
        "object_type" => "network",
        "object_id" => "net_firewall_main"
      },
      {
        "id" => "job_007",
        "created_at" => "2024-01-15T10:45:00Z",
        "name" => "Database Index Optimization",
        "policy" => "performance_optimization",
        "description" => "Optimize database indexes to improve query performance for reporting system",
        "state" => "canceled",
        "schedule_date" => "2024-01-15T22:00:00Z",
        "due_date" => "2024-01-16T01:00:00Z",
        "object_type" => "server",
        "object_id" => "srv_reporting_db"
      },
      {
        "id" => "job_008",
        "created_at" => "2024-01-15T13:30:00Z",
        "name" => "SSL Certificate Renewal",
        "policy" => "certificate_renewal",
        "description" => "Renew SSL certificates for all web services before expiration",
        "state" => "initial",
        "schedule_date" => "2024-01-25T01:00:00Z",
        "due_date" => "2024-01-25T03:00:00Z",
        "object_type" => "server",
        "object_id" => "srv_web_cluster"
      },
      {
        "id" => "job_009",
        "created_at" => "2024-01-15T14:15:00Z",
        "name" => "Network Bandwidth Analysis",
        "policy" => "monthly_analysis",
        "description" => "Analyze network bandwidth usage patterns and generate capacity planning report",
        "state" => "cancelling",
        "schedule_date" => "2024-01-15T15:00:00Z",
        "due_date" => "2024-01-15T18:00:00Z",
        "object_type" => "network",
        "object_id" => "net_wan_primary"
      },
      {
        "id" => "job_010",
        "created_at" => "2024-01-15T08:00:00Z",
        "name" => "Log Archive Cleanup",
        "policy" => "weekly_cleanup",
        "description" => "Archive old log files and clean up disk space on logging servers",
        "state" => "error",
        "schedule_date" => "2024-01-15T03:00:00Z",
        "due_date" => "2024-01-15T05:00:00Z",
        "object_type" => "server",
        "object_id" => "srv_logging_001"
      }
    ]
  end

  # Mock for elektron_smartops
  let(:elektron_smartops_mock) do
    double('elektron_smartops').tap do |mock|
      allow(mock).to receive(:get).and_return(
        double('response', body: { "jobs" => mock_jobs_data })
      )
      allow(mock).to receive(:post).and_return(
        double('response', header: double('header', code: '200'))
      )
    end
  end

  before do
    # Mock the elektron_smartops method on the test_class
    allow(test_class).to receive(:elektron_smartops).and_return(elektron_smartops_mock)
  end
  
  describe '#list_jobs' do
    context 'without filters' do
      it 'returns all jobs' do
        result = test_class.list_jobs
        
        expect(result).to be_an(Array)
        expect(result.length).to eq(10)
        expect(result.first).to include("id", "name", "state", "object_type")
      end

      it 'calls the API with correct parameters' do
        test_class.list_jobs
        
        expect(elektron_smartops_mock).to have_received(:get).with("jobs/", {})
      end
      
      it 'includes expected job structure' do
        result = test_class.list_jobs
        job = result.first
        
        expect(job).to include(
          "id", "created_at", "name", "policy", "description", 
          "state", "schedule_date", "due_date", "object_type", "object_id"
        )
      end
    end

    context 'filtering by name' do
      it 'filters jobs by partial name match (case-insensitive)' do
        result = test_class.list_jobs(name: 'backup')
        
        expect(result.length).to eq(1)
        expect(result.first["name"]).to include('Backup')
      end
      
      it 'filters jobs by partial name match with different case' do
        result = test_class.list_jobs(name: 'SERVER')
        
        expect(result.length).to eq(3)
        result.each do |job|
          expect(job["name"].downcase).to include('server')
        end
      end
      
      it 'returns empty array when no jobs match name filter' do
        result = test_class.list_jobs(name: 'nonexistent')
        
        expect(result).to be_empty
      end
      
      it 'handles empty name filter' do
        result = test_class.list_jobs(name: '')
        
        expect(result.length).to eq(10) # All jobs should match empty string
      end
    end

    context 'filtering by type (object_type)' do
      it 'filters jobs by server type' do
        result = test_class.list_jobs(type: 'server')
        
        expect(result.length).to eq(6)
        result.each do |job|
          expect(job["object_type"]).to eq('server')
        end
      end
      
      it 'filters jobs by network type' do
        result = test_class.list_jobs(type: 'network')
        
        expect(result.length).to eq(4)
        result.each do |job|
          expect(job["object_type"]).to eq('network')
        end
      end
      
      it 'returns empty array for non-existent type' do
        result = test_class.list_jobs(type: 'storage')
        
        expect(result).to be_empty
      end
    end

    context 'filtering by id' do
      it 'returns specific job by exact id match' do
        result = test_class.list_jobs(id: 'job_001')
        
        expect(result.length).to eq(1)
        expect(result.first["id"]).to eq('job_001')
        expect(result.first["name"]).to eq('Server Backup - Production DB')
      end
      
      it 'returns empty array for non-existent id' do
        result = test_class.list_jobs(id: 'job_999')
        
        expect(result).to be_empty
      end
    end

    context 'filtering by scheduled_date' do
      it 'returns jobs scheduled on or after the given date' do
        result = test_class.list_jobs(scheduled_date: '2024-01-15T12:00:00Z')
        
        expect(result.length).to eq(7)
        result.each do |job|
          job_date = Time.parse(job["schedule_date"])
          filter_date = Time.parse('2024-01-15T12:00:00Z')
          expect(job_date).to be >= filter_date
        end
      end
      
      it 'returns jobs scheduled exactly at the given date' do
        result = test_class.list_jobs(scheduled_date: '2024-01-15T10:00:00Z')
        
        matching_job = result.find { |job| job["schedule_date"] == '2024-01-15T10:00:00Z' }
        expect(matching_job).not_to be_nil
        expect(matching_job["name"]).to eq('Network Security Scan')
      end
      
      it 'returns empty array when no jobs match scheduled_date filter' do
        result = test_class.list_jobs(scheduled_date: '2024-12-31T23:59:59Z')
        
        expect(result).to be_empty
      end
    end

    context 'filtering by due_date' do
      it 'returns jobs due on or before the given date' do
        result = test_class.list_jobs(due_date: '2024-01-15T18:00:00Z')
        
        expect(result.length).to eq(5)
        result.each do |job|
          job_date = Time.parse(job["due_date"])
          filter_date = Time.parse('2024-01-15T18:00:00Z')
          expect(job_date).to be <= filter_date
        end
      end
      
      it 'returns jobs due exactly at the given date' do
        result = test_class.list_jobs(due_date: '2024-01-15T14:00:00Z')
        
        matching_job = result.find { |job| job["due_date"] == '2024-01-15T14:00:00Z' }
        expect(matching_job).not_to be_nil
        expect(matching_job["name"]).to eq('Network Security Scan')
      end
      
      it 'returns empty array when no jobs match due_date filter' do
        result = test_class.list_jobs(due_date: '2024-01-01T00:00:00Z')
        
        expect(result).to be_empty
      end
    end

    context 'combining multiple filters' do
      it 'filters by name and type together' do
        result = test_class.list_jobs(name: 'server', type: 'server')
        
        expect(result.length).to eq(3)
        result.each do |job|
          expect(job["object_type"]).to eq('server')
          expect(job["name"].downcase).to include('server')
        end
      end
      
      it 'filters by type and scheduled_date together' do
        result = test_class.list_jobs(
          type: 'network', 
          scheduled_date: '2024-01-15T15:00:00Z'
        )
        
        expect(result.length).to eq(3)
        result.each do |job|
          expect(job["object_type"]).to eq('network')
          job_date = Time.parse(job["schedule_date"])
          filter_date = Time.parse('2024-01-15T15:00:00Z')
          expect(job_date).to be >= filter_date
        end
      end
      
      it 'filters by name, type, and date range' do
        result = test_class.list_jobs(
          name: 'network',
          type: 'network',
          scheduled_date: '2024-01-15T10:00:00Z',
          due_date: '2024-01-15T20:00:00Z'
        )
        
        expect(result.length).to eq(2)
        result.each do |job|
          expect(job["object_type"]).to eq('network')
          expect(job["name"].downcase).to include('network')
          
          schedule_date = Time.parse(job["schedule_date"])
          due_date = Time.parse(job["due_date"])
          expect(schedule_date).to be >= Time.parse('2024-01-15T10:00:00Z')
          expect(due_date).to be <= Time.parse('2024-01-15T20:00:00Z')
        end
      end
      
      it 'returns empty array when combined filters match nothing' do
        result = test_class.list_jobs(
          name: 'backup',
          type: 'network'
        )
        
        expect(result).to be_empty
      end
    end

    context 'performance and behavior' do     
      it 'handles nil filter values gracefully' do
        expect {
          test_class.list_jobs(name: nil, type: nil)
        }.not_to raise_error
      end
      
      it 'handles empty filter hash' do
        result = test_class.list_jobs({})
        
        expect(result.length).to eq(10)
      end

      it 'passes filter parameters to API' do
        filter = { name: 'test', type: 'server' }
        test_class.list_jobs(filter)
        
        expect(elektron_smartops_mock).to have_received(:get).with("jobs/", filter)
      end
    end

    context 'job states verification' do
      it 'includes all expected job states' do
        result = test_class.list_jobs
        states = result.map { |job| job["state"] }.uniq
        
        expected_states = %w[successful running scheduled pending failed waiting canceled initial cancelling error]
        expect(states).to match_array(expected_states)
      end
      
      it 'can filter indirectly by checking returned job properties' do
        result = test_class.list_jobs(id: 'job_002')
        
        expect(result.first["state"]).to eq('running')
        expect(result.first["name"]).to eq('Network Security Scan')
      end
    end

    context 'date format handling' do
      it 'handles different date formats correctly' do
        expect {
          test_class.list_jobs(scheduled_date: '2024-01-15T10:00:00Z')
        }.not_to raise_error
        
        expect {
          test_class.list_jobs(scheduled_date: '2024-01-15T10:00:00+00:00')
        }.not_to raise_error
      end
      
      it 'raises error for invalid date format' do
        expect {
          test_class.list_jobs(scheduled_date: 'invalid-date')
        }.to raise_error(ArgumentError)
      end
    end

    context 'edge cases' do
      it 'handles partial word matches in name filter' do
        result = test_class.list_jobs(name: 'Config')
        
        expect(result.length).to eq(1)
        expect(result.first["name"]).to include('Configuration')
      end
      
      it 'handles case sensitivity correctly' do
        result_upper = test_class.list_jobs(name: 'SSL')
        result_lower = test_class.list_jobs(name: 'ssl')
        
        expect(result_upper).to eq(result_lower)
        expect(result_upper.length).to eq(1)
      end
      
      it 'filters by exact object_id indirectly through other filters' do
        result = test_class.list_jobs(id: 'job_003')
        
        expect(result.first["object_id"]).to eq('srv_web_001')
      end
    end
  end

  describe '#schedule_job' do
    let(:job_id) { 'job_001' }
    let(:schedule_date) { '2024-01-20T10:00:00Z' }

    it 'calls the API to schedule a job' do
      result = test_class.schedule_job(job_id, schedule_date)
      
      expect(result).to be true
      expect(elektron_smartops_mock).to have_received(:post).with("jobs/#{job_id}/schedule")
    end

    it 'returns true on successful scheduling' do
      result = test_class.schedule_job(job_id, schedule_date)
      
      expect(result).to eq(true)
    end

    context 'when API returns error' do
      it 'raises an error for 400 status code' do
        allow(elektron_smartops_mock).to receive(:post).and_return(
          double('response', header: double('header', code: '400'))
        )

        expect {
          test_class.schedule_job(job_id, schedule_date)
        }.to raise_error('Could not schedule job')
      end

      it 'raises an error for 500 status code' do
        allow(elektron_smartops_mock).to receive(:post).and_return(
          double('response', header: double('header', code: '500'))
        )

        expect {
          test_class.schedule_job(job_id, schedule_date)
        }.to raise_error('Could not schedule job')
      end
    end

    context 'with different job IDs' do
      it 'schedules job_002' do
        result = test_class.schedule_job('job_002', schedule_date)
        
        expect(result).to be true
        expect(elektron_smartops_mock).to have_received(:post).with("jobs/job_002/schedule")
      end

      it 'schedules job_010' do
        result = test_class.schedule_job('job_010', schedule_date)
        
        expect(result).to be true
        expect(elektron_smartops_mock).to have_received(:post).with("jobs/job_010/schedule")
      end
    end

    context 'with different schedule dates' do
      it 'schedules with future date' do
        future_date = '2024-12-31T23:59:59Z'
        result = test_class.schedule_job(job_id, future_date)
        
        expect(result).to be true
      end

      it 'schedules with past date' do
        past_date = '2024-01-01T00:00:00Z'
        result = test_class.schedule_job(job_id, past_date)
        
        expect(result).to be true
      end
    end
  end
end
