require "spec_helper"
RSpec.describe ServiceLayer::KubernetesNgServices::Clusters do
  include ServiceLayer::KubernetesNgServices::Clusters
  describe "convert_shoot_to_cluster" do
    it "converts a full blown valid shoot to cluster format" do
      shoot_mock = {
        'metadata' => {
          'name' => 'test-cluster',
          'namespace' => 'garden-test',
          'uid' => '12345678-1234-1234-1234-123456789012',
          'resourceVersion' => '1234567',
          'generation' => 1,
          'creationTimestamp' => Time.now.iso8601,
          'labels' => {
            'environment' => 'production',
            'team' => 'devops'
          }
        },
        'spec' => {
          'cloudProfileName' => 'openstack',
          'kubernetes' => {
            'version' => '1.25.4'
          },
          'secretBindingName' => 'my-secret',
          'purpose' => 'evaluation',
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
        purpose: shoot_mock['spec']['purpose'],
        cloudProfileName: shoot_mock['spec']['cloudProfileName'],
        namespace: shoot_mock['metadata']['namespace'],
        secretBindingName: shoot_mock['spec']['secretBindingName'],
        labels: shoot_mock['metadata']['labels'],
        readiness: {
          conditions: [
            {
              displayValue: 'API',
              status: 'True',
              type: 'APIServerAvailable',
              message: 'API server is running',
              lastUpdateTime: '2023-05-01T09:58:00Z'
            },
            {
              displayValue: 'CP',
              status: 'True',
              type: 'ControlPlaneHealthy',
              message: 'Control plane is running',
              lastUpdateTime: '2023-05-01T09:59:00Z'
            }
          ],
          status: '2/2'
        },
        stateDetails: {
          progress: 100,
          type: 'Reconcile',
          state: 'Succeeded',
          description: 'Cluster is running',
          lastTransitionTime: '2023-05-01T10:00:00Z'
        },
        raw: shoot_mock
      )
    end

    it "handles shoot with minimal required fields only" do
      minimal_shoot = {
        'metadata' => {
          'name' => 'minimal-cluster',
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
            'workers' => []
          },
          'region' => 'eu-de'
        }
      }
      cluster = convert_shoot_to_cluster(minimal_shoot)
      expect(cluster[:name]).to eq('minimal-cluster')
      expect(cluster[:region]).to eq('eu-de')
      expect(cluster[:infrastructure]).to eq('openstack')
    end
    
    it "handles shoot with optional addons" do
      shoot_with_addons = {
        'metadata' => {
          'name' => 'addon-cluster',
          'namespace' => 'garden-test',
          'uid' => '12345678-1234-1234-1234-123456789012',
          'resourceVersion' => '1234567',
          'generation' => 1,
          'creationTimestamp' => Time.now.iso8601
        },
        'spec' => {
          'addons' => {
            'kubernetesDashboard' => {
              'enabled' => true,
              'authenticationMode' => 'token'
            },
            'nginxIngress' => {
              'enabled' => true,
              'externalTrafficPolicy' => 'Local'
            }
          },
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
            'workers' => []
          },
          'region' => 'eu-de'
        }
      }
      cluster = convert_shoot_to_cluster(shoot_with_addons)
      expect(cluster[:name]).to eq('addon-cluster')
      # Add expectations for how addons are handled in your conversion logic
    end
    
    it "handles shoot with DNS configuration" do
      shoot_with_dns = {
        'metadata' => {
          'name' => 'dns-cluster',
          'namespace' => 'garden-test',
          'uid' => '12345678-1234-1234-1234-123456789012',
          'resourceVersion' => '1234567',
          'generation' => 1,
          'creationTimestamp' => Time.now.iso8601
        },
        'spec' => {
          'dns' => {
            'domain' => 'example.com'
          },
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
            'workers' => []
          },
          'region' => 'eu-de'
        }
      }
      cluster = convert_shoot_to_cluster(shoot_with_dns)
      expect(cluster[:name]).to eq('dns-cluster')
      # Add expectations for DNS handling
    end
    
    it "handles shoot with hibernation schedules" do
      shoot_with_hibernation = {
        'metadata' => {
          'name' => 'hibernation-cluster',
          'namespace' => 'garden-test',
          'uid' => '12345678-1234-1234-1234-123456789012',
          'resourceVersion' => '1234567',
          'generation' => 1,
          'creationTimestamp' => Time.now.iso8601
        },
        'spec' => {
          'hibernation' => {
            'schedules' => [
              {
                'start' => '2200',
                'location' => 'Europe/Berlin'
              },
              {
                'start' => '1800',
                'location' => 'America/New_York'
              }
            ]
          },
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
            'workers' => []
          },
          'region' => 'eu-de'
        }
      }
      cluster = convert_shoot_to_cluster(shoot_with_hibernation)
      expect(cluster[:name]).to eq('hibernation-cluster')
      # Add expectations for hibernation handling
    end
    
    it "handles shoot with extended kubernetes configuration" do
      shoot_with_k8s_config = {
        'metadata' => {
          'name' => 'k8s-config-cluster',
          'namespace' => 'garden-test',
          'uid' => '12345678-1234-1234-1234-123456789012',
          'resourceVersion' => '1234567',
          'generation' => 1,
          'creationTimestamp' => Time.now.iso8601
        },
        'spec' => {
          'cloudProfileName' => 'openstack',
          'kubernetes' => {
            'version' => '1.25.4',
            'kubeAPIServer' => {
              'requests' => {
                'maxNonMutatingInflight' => 400,
                'maxMutatingInflight' => 200
              },
              'enableAnonymousAuthentication' => false,
              'eventTTL' => '1h',
              'logging' => {
                'verbosity' => 2
              },
              'defaultNotReadyTolerationSeconds' => 300,
              'defaultUnreachableTolerationSeconds' => 300
            },
            'kubeControllerManager' => {
              'nodeCIDRMaskSize' => 24,
              'nodeMonitorGracePeriod' => '40s'
            },
            'kubeScheduler' => {
              'profile' => 'default'
            },
            'kubeProxy' => {
              'mode' => 'ipvs',
              'enabled' => true
            },
            'kubelet' => {
              'failSwapOn' => false,
              'kubeReserved' => {
                'cpu' => '100m',
                'memory' => '1Gi'
              },
              'imageGCHighThresholdPercent' => 85,
              'imageGCLowThresholdPercent' => 80,
              'serializeImagePulls' => false
            },
            'verticalPodAutoscaler' => {
              'enabled' => true,
              'evictAfterOOMThreshold' => '10m',
              'evictionRateBurst' => 1,
              'evictionRateLimit' => 0.1
            }
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
            'workers' => []
          },
          'region' => 'eu-de'
        }
      }
      cluster = convert_shoot_to_cluster(shoot_with_k8s_config)
      expect(cluster[:name]).to eq('k8s-config-cluster')
      # Add expectations for kubernetes config handling
    end
    
    it "handles shoot with system components configuration" do
      shoot_with_system_components = {
        'metadata' => {
          'name' => 'system-components-cluster',
          'namespace' => 'garden-test',
          'uid' => '12345678-1234-1234-1234-123456789012',
          'resourceVersion' => '1234567',
          'generation' => 1,
          'creationTimestamp' => Time.now.iso8601
        },
        'spec' => {
          'systemComponents' => {
            'coreDNS' => {
              'autoscaling' => {
                'mode' => 'horizontal'
              }
            },
            'nodeLocalDNS' => {
              'enabled' => true,
              'forceTCPToUpstreamDNS' => false
            }
          },
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
            'workers' => []
          },
          'region' => 'eu-de'
        }
      }
      cluster = convert_shoot_to_cluster(shoot_with_system_components)
      expect(cluster[:name]).to eq('system-components-cluster')
      # Add expectations for system components handling
    end
    
    it "handles shoot with optional provider settings" do
      shoot_with_provider_settings = {
        'metadata' => {
          'name' => 'provider-settings-cluster',
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
            'workers' => [],
            'workersSettings' => {
              'sshAccess' => {
                'enabled' => true
              }
            }
          },
          'region' => 'eu-de',
          'purpose' => 'testing',
          'secretBindingName' => 'my-secret',
          'seedName' => 'my-seed',
          'schedulerName' => 'custom-scheduler'
        }
      }
      cluster = convert_shoot_to_cluster(shoot_with_provider_settings)
      expect(cluster[:name]).to eq('provider-settings-cluster')
      # Add expectations for provider settings handling
    end
    
    it "handles shoot with complete status information" do
      shoot_with_full_status = {
        'metadata' => {
          'name' => 'full-status-cluster',
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
            'workers' => []
          },
          'region' => 'eu-de'
        },
        'status' => {
          'hibernated' => false,
          'observedGeneration' => 1,
          'seedName' => 'eu-de-seed',
          'technicalID' => 'shoot--garden--test-cluster',
          'uid' => '12345678-1234-1234-1234-123456789012',
          'clusterIdentity' => 'cluster-identity-123',
          'gardener' => {
            'id' => 'gardener-123',
            'name' => 'gardener-controller',
            'version' => '1.68.0'
          },
          'lastMaintenance' => {
            'description' => 'Maintenance completed successfully',
            'triggeredTime' => '2023-05-01T02:00:00Z',
            'state' => 'Succeeded'
          },
          'lastErrors' => [
            {
              'description' => 'Some recoverable error',
              'lastUpdateTime' => '2023-05-01T01:00:00Z'
            }
          ]
        }
      }
      cluster = convert_shoot_to_cluster(shoot_with_full_status)
      expect(cluster[:name]).to eq('full-status-cluster')
      # Add expectations for status handling
    end
    
    it "handles shoot with IPv6 networking" do
      shoot_with_ipv6 = {
        'metadata' => {
          'name' => 'ipv6-cluster',
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
            'providerConfig' => {
              'overlay' => {
                'enabled' => true
              }
            },
            'pods' => '100.96.0.0/11',
            'nodes' => '10.250.0.0/16',
            'services' => '100.64.0.0/13',
            'ipFamilies' => ['IPv4', 'IPv6']
          },
          'provider' => {
            'type' => 'openstack',
            'controlPlaneConfig' => {},
            'infrastructureConfig' => {},
            'workers' => []
          },
          'region' => 'eu-de'
        }
      }
      cluster = convert_shoot_to_cluster(shoot_with_ipv6)
      expect(cluster[:name]).to eq('ipv6-cluster')
      # Add expectations for IPv6 handling
    end
  end
  
  describe "convert_cluster_to_shoot" do
    it "converts a valid full blown cluster to shoot format" do
      cluster_mock = {
        uid: '12345678-1234-1234-1234-123456789012',
        name: 'test-cluster',
        region: 'eu-de',
        infrastructure: 'openstack',
        cloudProfileName: 'openstack',
        version: '1.25.4',
        purpose: 'production',
        metadata: {
          labels: {
            environment: 'production',
            team: 'devops'
          }
        },
        workers: [
          {
            name: 'worker-pool-1',
            machineType: 'm1.large',
            architecture: 'amd64',
            machineImage: {
              name: 'ubuntu',
              version: '20.04'
            },
            containerRuntime: 'containerd',
            min: 2,
            max: 5,
            maxSurge: 1,
            zones: ['eu-de-1', 'eu-de-2']
          }
        ],
        maintenance: {
          startTime: '220000+0100',
          windowTime: '230000+0100',
          timezone: 'Europe/Berlin'
        },
        autoUpdate: {
          os: true,
          kubernetes: true
        }
      }
      shoot = convert_cluster_to_shoot(cluster_mock)
      expect(shoot).to eq({
        'metadata' => {
          'uid' => '12345678-1234-1234-1234-123456789012',
          'name' => 'test-cluster',
        },
        'spec' => {
          'region' => 'eu-de',
          'purpose' => 'production',
          'cloudProfileName' => 'openstack',
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
    
    it "handles cluster with minimal fields" do
      minimal_cluster = {
        uid: '12345678-1234-1234-1234-123456789012',
        name: 'minimal-cluster',
        region: 'eu-de',
        infrastructure: 'openstack',
        version: '1.25.4'
      }
      shoot = convert_cluster_to_shoot(minimal_cluster)
      expect(shoot['metadata']['name']).to eq('minimal-cluster')
      expect(shoot['spec']['region']).to eq('eu-de')
      expect(shoot['spec']['provider']['type']).to eq('openstack')
      expect(shoot['spec']['kubernetes']['version']).to eq('1.25.4')
    end
    
    it "handles cluster without optional maintenance settings" do
      cluster_without_maintenance = {
        uid: '12345678-1234-1234-1234-123456789012',
        name: 'no-maintenance-cluster',
        region: 'eu-de',
        infrastructure: 'openstack',
        version: '1.25.4',
        workers: []
      }
      shoot = convert_cluster_to_shoot(cluster_without_maintenance)
      expect(shoot['spec']['maintenance']).to be_nil
    end
    
    it "handles cluster without hibernation settings" do
      cluster_without_hibernation = {
        uid: '12345678-1234-1234-1234-123456789012',
        name: 'no-hibernation-cluster',
        region: 'eu-de',
        infrastructure: 'openstack',
        version: '1.25.4',
        workers: []
      }
      shoot = convert_cluster_to_shoot(cluster_without_hibernation)
      expect(shoot['spec']['hibernation']).to be_nil
    end
  end
end
