# Configure secret_key_base for Rails 7.1+
# This replaces the deprecated config/secrets.yml file

Rails.application.configure do
  # Set secret_key_base from environment or generate a test key
  config.secret_key_base = case Rails.env
                           when 'production'
                             ENV['MONSOON_RAILS_SECRET_TOKEN'] || raise('MONSOON_RAILS_SECRET_TOKEN environment variable must be set in production')
                           when 'test'
                             # Generate a consistent test key
                             '4a49f663c106f4f502f0bf5b48ae7f3f8d08b51875dda2b87611c80050f57345dea5c97dc310b900161e1bdf98787ced3eaf75b3353b8efb80a05ad78d2ea6ba'
                           when 'development'
                             # Generate a consistent development key
                             '2fbd53431148199e61690926ffa721dc620f22c8fb923a7a87987bf313aa890e046c7e6d164be855d8519b7ca280e8156d0b55b78f43d6751dc39c17c88a0078'
                           else
                             # For other environments, try ENV or generate
                             ENV['SECRET_KEY_BASE'] || SecureRandom.hex(64)
                           end
end
