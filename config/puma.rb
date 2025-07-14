
# Set thread count with reasonable min/max range
# I/O-intensive Application (APIs, File Operations): MAX_THREADS = 10, MIN_THREADS = 2
# High-Traffic Application: 16 threads: MAX_THREADS = 16, MIN_THREADS = 4

threads_count = Integer(ENV["MAX_THREADS"] || 16) # maximum threads that can be used
min_threads = Integer(ENV["MIN_THREADS"] || 4)  # minimum threads that are always available
threads min_threads, threads_count

environment ENV["RAILS_ENV"] || "production"
port ENV["PORT"] || 80

# http keep alive idle timeout
persistent_timeout Integer(ENV["PERSISTENT_TIMEOUT"] || 61)

require "puma/app/status"
activate_control_app "tcp://127.0.0.1:7353", { no_token: "true" }

plugin :tmp_restart

supported_http_methods(Puma::Const::SUPPORTED_HTTP_METHODS + ['COPY'])