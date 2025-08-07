module ColorizedLogger
  COLORS = {
    debug: "\e[0;36m",  # Cyan
    info: "\e[0;32m",   # Green
    warn: "\e[1;33m",   # Yellow
    error: "\e[1;31m",  # Red
    fatal: "\e[1;31m",  # Red
    unknown: "\e[0m"    # Default
  }.freeze

  RESET_COLOR = "\e[0m"

  COLORS.each_key do |level|
    define_method(level) do |progname = nil, &block|
      message = progname || (block && block.call)
      super("#{COLORS[level]}#{message}#{RESET_COLOR}")
    end
  end
end

if Rails.env.development?
  # Extend Rails logger with colorized logging in development environment
  Rails.logger.extend(ColorizedLogger)
end
