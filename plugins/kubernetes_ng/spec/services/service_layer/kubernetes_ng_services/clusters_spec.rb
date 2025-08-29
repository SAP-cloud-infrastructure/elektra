require "spec_helper"

RSpec.describe ServiceLayer::KubernetesNgServices::Clusters do
  include ServiceLayer::KubernetesNgServices::Clusters
  describe "convert_shoot_to_cluster" do
    it "converts a valid shoot to cluster format" do
      shoot_mock = {
        'metadata' => {
          'name' => 'test-cluster',
          'namespace' => 'garden-test',
          'uid' => '12345678-1234-1234-1234-123456789012',
          'resourceVersion' => '1234567',
          'generation' => 1,
          'creationTimestamp' => Time.now.iso8601
        },
        'spec' => {
          'cloudProfileName' => 'openstack',
          'kubernetes' => {
            'version' => '1.25.4'
          },
          'networking' => {
            'type' => 'calico',
            'pods' => '100.96.0.0/11',
            'nodes' => '10.250.0.0/16',
            'services' => '100.64.0.0/13',
            'ipFamilies' => ['IPv4']
          },
          'provider' => {
            'type' => 'openstack',
            'controlPlaneConfig' => {},
            'infrastructureConfig' => {},
            'workers' => [
              {
                'name' => 'worker-pool-1',
                'machine' => {
                  'type' => 'm1.large',
                  'image' => {
                    'name' => 'ubuntu',
                    'version' => '20.04'
                  },
                  'architecture' => 'amd64'
                },
                'maximum' => 5,
                'minimum' => 2,
                'maxSurge' => 1,
                'maxUnavailable' => 0,
                'zones' => ['eu-de-1', 'eu-de-2'],
                'cri' => {
                  'name' => 'containerd'
                },
                'systemComponents' => {
                  'allow' => true
                },
                'updateStrategy' => 'RollingUpdate'
              }
            ]
          },
          'region' => 'eu-de',
          'maintenance' => {
            'autoUpdate' => {
              'kubernetesVersion' => true,
              'machineImageVersion' => true
            },
            'timeWindow' => {
              'begin' => '220000+0100',
              'end' => '230000+0100'
            }
          }
        },
        'status' => {
          'lastOperation' => {
            'description' => 'Cluster is running',
            'lastUpdateTime' => '2023-05-01T10:00:00Z',
            'progress' => 100,
            'state' => 'Succeeded',
            'type' => 'Reconcile'
          },
          'conditions' => [
            {
              'type' => 'APIServerAvailable',
              'status' => 'True',
              'lastTransitionTime' => '2023-05-01T09:58:00Z',
              'lastUpdateTime' => '2023-05-01T09:58:00Z',
              'reason' => 'APIServerRunning',
              'message' => 'API server is running'
            },
            {
              'type' => 'ControlPlaneHealthy',
              'status' => 'True',
              'lastTransitionTime' => '2023-05-01T09:59:00Z',
              'lastUpdateTime' => '2023-05-01T09:59:00Z',
              'reason' => 'ControlPlaneRunning',
              'message' => 'Control plane is running'
            }
          ]
        }
      }

      cluster = convert_shoot_to_cluster(shoot_mock)
      expect(cluster).to include(
        uid: shoot_mock['metadata']['uid'],
        name: shoot_mock['metadata']['name'],
        region: shoot_mock['spec']['region'],
        infrastructure: shoot_mock['spec']['provider']['type'],
        status: 'Operational',
        version: shoot_mock['spec']['kubernetes']['version'],
        readiness: {
          conditions: [
            {
              display_value: 'API',
              status: 'True',
              type: 'APIServerAvailable'
            },
            {
              display_value: 'CP',
              status: 'True',
              type: 'ControlPlaneHealthy'
            }
          ],
          status: '2/2'
        },
        state_details: {
          progress: 100,
          type: 'Reconcile',
          state: 'Succeeded',
          description: 'Cluster is running',
          last_transition_time: '2023-05-01T10:00:00Z'
        }
      )
    end
  end

  describe "convert_cluster_to_shoot" do
    it "converts a valid cluster to shoot format" do
      cluster_mock = {
        uid: '12345678-1234-1234-1234-123456789012',
        name: 'test-cluster',
        region: 'eu-de',
        infrastructure: 'openstack',
        version: '1.25.4',
        purpose: 'production',
        workers: [
          {
            name: 'worker-pool-1',
            machine_type: 'm1.large',
            architecture: 'amd64',
            machine_image: {
              name: 'ubuntu',
              version: '20.04'
            },
            container_runtime: 'containerd',
            min: 2,
            max: 5,
            max_surge: 1,
            zones: ['eu-de-1', 'eu-de-2']
          }
        ],
        maintenance: {
          start_time: '220000+0100',
          window_time: '230000+0100',
          timezone: 'Europe/Berlin'
        },
        auto_update: {
          os: true,
          kubernetes: true
        }
      }

      shoot = convert_cluster_to_shoot(cluster_mock)

      expect(shoot).to eq({
        'metadata' => {
          'uid' => '12345678-1234-1234-1234-123456789012',
          'name' => 'test-cluster'
        },
        'spec' => {
          'region' => 'eu-de',
          'purpose' => 'production',
          'provider' => {
            'type' => 'openstack',
            'workers' => [
              {
                'name' => 'worker-pool-1',
                'minimum' => 2,
                'maximum' => 5,
                'maxSurge' => 1,
                'zones' => ['eu-de-1', 'eu-de-2'],
                'machine' => {
                  'type' => 'm1.large',
                  'architecture' => 'amd64',
                  'image' => {
                    'name' => 'ubuntu',
                    'version' => '20.04'
                  }
                },
                'cri' => {
                  'name' => 'containerd'
                }
              }
            ]
          },
          'kubernetes' => {
            'version' => '1.25.4'
          },
          'maintenance' => {
            'timeWindow' => {
              'begin' => '220000+0100',
              'end' => '230000+0100'
            },
            'autoUpdate' => {
              'machineImageVersion' => true,
              'kubernetesVersion' => true
            }
          },
          'hibernation' => {
            'schedules' => [
              {
                'location' => 'Europe/Berlin'
              }
            ]
          }
        }
      })
    end
  end

end