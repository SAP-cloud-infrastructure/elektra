class @PolicyEngine
  constructor: (data={}) ->
    throw "Missing data. Please provide rules and locals" unless data
    throw "Missing rules. Please provide rules" unless data.rules
    throw "Missing locals. Please provide locals" unless data.locals
    # locals are user specific attributes like domain_id, roles ect.

    @rules = data.rules
    for name,rule of @rules
      try
        @rules[name]=eval(rule)
      catch e  

    @locals = data.locals

  isAllowed: (name, params={}) ->
    rule = @rules[name]
    throw "Rule #{name} not found." unless rule
    rule(@rules,@locals,params)
