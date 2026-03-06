require 'spec_helper'

describe MonsoonOpenstackAuth::Authorization::SafeRuleParser do
  let(:parser) { MonsoonOpenstackAuth::Authorization::SafeRuleParser }
  let(:ast_mod) { MonsoonOpenstackAuth::Authorization::SafeRuleParser::AST }

  describe '.tokenize' do
    it 'tokenizes role:name' do
      tokens = parser.tokenize('role:admin')
      expect(tokens.length).to eq(1)
      expect(tokens[0].type).to eq(:role)
      expect(tokens[0].value).to eq('admin')
    end

    it 'tokenizes rule:name' do
      tokens = parser.tokenize('rule:admin_required')
      expect(tokens.length).to eq(1)
      expect(tokens[0].type).to eq(:rule)
      expect(tokens[0].value).to eq('admin_required')
    end

    it 'tokenizes rule:name with colons' do
      tokens = parser.tokenize('rule:identity:domain_list')
      expect(tokens.length).to eq(1)
      expect(tokens[0].type).to eq(:rule)
      expect(tokens[0].value).to eq('identity:domain_list')
    end

    it 'tokenizes @ as true' do
      tokens = parser.tokenize('@')
      expect(tokens.length).to eq(1)
      expect(tokens[0].type).to eq(:true)
    end

    it 'tokenizes ! as false' do
      tokens = parser.tokenize('!')
      expect(tokens.length).to eq(1)
      expect(tokens[0].type).to eq(:false)
    end

    it 'tokenizes True/False' do
      tokens = parser.tokenize('True')
      expect(tokens[0].type).to eq(:true)

      tokens = parser.tokenize('False')
      expect(tokens[0].type).to eq(:false)
    end

    it 'tokenizes and/or/not' do
      tokens = parser.tokenize('role:admin and role:member or not role:guest')
      types = tokens.map(&:type)
      expect(types).to eq([:role, :and, :role, :or, :not, :role])
    end

    it 'tokenizes parentheses' do
      tokens = parser.tokenize('(role:admin or role:member)')
      types = tokens.map(&:type)
      expect(types).to eq([:lparen, :role, :or, :role, :rparen])
    end

    it 'tokenizes local:%(param)s comparisons' do
      tokens = parser.tokenize('domain_id:%(domain.id)s')
      expect(tokens.length).to eq(1)
      expect(tokens[0].type).to eq(:local_compare)
      expect(tokens[0].value[:local]).to eq('domain_id')
      expect(tokens[0].value[:param]).to eq('domain.id')
    end

    it 'tokenizes local:literal comparisons' do
      tokens = parser.tokenize('domain_id:default')
      expect(tokens.length).to eq(1)
      expect(tokens[0].type).to eq(:local_compare)
      expect(tokens[0].value[:local]).to eq('domain_id')
      expect(tokens[0].value[:literal]).to eq('default')
    end

    it 'returns empty array for empty string' do
      tokens = parser.tokenize('')
      expect(tokens).to eq([])
    end
  end

  describe '.build' do
    it 'parses empty rule as true' do
      ast = parser.build('')
      expect(ast).to be_a(ast_mod::LiteralTrue)
    end

    it 'parses @ as true' do
      ast = parser.build('@')
      expect(ast).to be_a(ast_mod::LiteralTrue)
    end

    it 'parses ! as false' do
      ast = parser.build('!')
      expect(ast).to be_a(ast_mod::LiteralFalse)
    end

    it 'parses role:name' do
      ast = parser.build('role:admin')
      expect(ast).to be_a(ast_mod::RoleCheck)
      expect(ast.role_name).to eq('admin')
    end

    it 'parses rule:name' do
      ast = parser.build('rule:admin_required')
      expect(ast).to be_a(ast_mod::RuleRef)
      expect(ast.rule_name).to eq('admin_required')
    end

    it 'parses or expressions' do
      ast = parser.build('role:admin or role:member')
      expect(ast).to be_a(ast_mod::OrNode)
      expect(ast.left).to be_a(ast_mod::RoleCheck)
      expect(ast.right).to be_a(ast_mod::RoleCheck)
    end

    it 'parses and expressions' do
      ast = parser.build('role:admin and domain_id:default')
      expect(ast).to be_a(ast_mod::AndNode)
      expect(ast.left).to be_a(ast_mod::RoleCheck)
      expect(ast.right).to be_a(ast_mod::LocalCompare)
    end

    it 'parses not expressions' do
      ast = parser.build('not role:admin')
      expect(ast).to be_a(ast_mod::NotNode)
      expect(ast.operand).to be_a(ast_mod::RoleCheck)
    end

    it 'parses parenthesized expressions' do
      ast = parser.build('(role:admin or role:member) and domain_id:default')
      expect(ast).to be_a(ast_mod::AndNode)
      expect(ast.left).to be_a(ast_mod::OrNode)
    end

    it 'respects operator precedence (and binds tighter than or)' do
      ast = parser.build('role:admin or role:member and domain_id:default')
      expect(ast).to be_a(ast_mod::OrNode)
      expect(ast.right).to be_a(ast_mod::AndNode)
    end

    it 'parses local:%(param)s comparisons' do
      ast = parser.build('domain_id:%(domain.id)s')
      expect(ast).to be_a(ast_mod::LocalCompare)
      expect(ast.local_name).to eq('domain_id')
      expect(ast.param_path).to eq('domain.id')
      expect(ast.literal_value).to be_nil
    end

    it 'parses complex nested rules' do
      ast = parser.build('(rule:admin_required and domain_id:%(target.token.user.domain.id)s) or rule:owner')
      expect(ast).to be_a(ast_mod::OrNode)
      expect(ast.left).to be_a(ast_mod::AndNode)
      expect(ast.right).to be_a(ast_mod::RuleRef)
    end
  end

  describe '.evaluate' do
    let(:admin_locals) { { 'roles' => ['admin'], 'domain_id' => 'dom-123' } }
    let(:member_locals) { { 'roles' => ['member'], 'domain_id' => 'dom-456' } }
    let(:empty_locals) { { 'roles' => [], 'domain_id' => 'dom-789' } }

    it 'evaluates true literal' do
      ast = parser.build('@')
      expect(parser.evaluate(ast, {}, {}, nil)).to eq(true)
    end

    it 'evaluates false literal' do
      ast = parser.build('!')
      expect(parser.evaluate(ast, {}, {}, nil)).to eq(false)
    end

    it 'evaluates role check - present' do
      ast = parser.build('role:admin')
      expect(parser.evaluate(ast, admin_locals, {}, nil)).to eq(true)
    end

    it 'evaluates role check - absent' do
      ast = parser.build('role:admin')
      expect(parser.evaluate(ast, member_locals, {}, nil)).to eq(false)
    end

    it 'evaluates or expression' do
      ast = parser.build('role:admin or role:member')
      expect(parser.evaluate(ast, admin_locals, {}, nil)).to eq(true)
      expect(parser.evaluate(ast, member_locals, {}, nil)).to eq(true)
      expect(parser.evaluate(ast, empty_locals, {}, nil)).to eq(false)
    end

    it 'evaluates and expression' do
      ast = parser.build('role:admin and domain_id:dom-123')
      expect(parser.evaluate(ast, admin_locals, {}, nil)).to eq(true)
      expect(parser.evaluate(ast, member_locals, {}, nil)).to eq(false)
    end

    it 'evaluates not expression' do
      ast = parser.build('not role:admin')
      expect(parser.evaluate(ast, admin_locals, {}, nil)).to eq(false)
      expect(parser.evaluate(ast, member_locals, {}, nil)).to eq(true)
    end

    it 'evaluates literal comparison' do
      ast = parser.build('domain_id:dom-123')
      expect(parser.evaluate(ast, admin_locals, {}, nil)).to eq(true)
      expect(parser.evaluate(ast, member_locals, {}, nil)).to eq(false)
    end

    it 'evaluates param comparison' do
      ast = parser.build('domain_id:%(domain.id)s')
      params = { domain: OpenStruct.new(id: 'dom-123') }
      expect(parser.evaluate(ast, admin_locals, params, nil)).to eq(true)
      expect(parser.evaluate(ast, member_locals, params, nil)).to eq(false)
    end

    it 'evaluates param comparison with missing param as false' do
      ast = parser.build('domain_id:%(nonexistent.path)s')
      expect(parser.evaluate(ast, admin_locals, {}, nil)).to eq(false)
    end
  end

  describe '.extract_locals' do
    it 'extracts role check locals' do
      ast = parser.build('role:admin')
      expect(parser.extract_locals(ast)).to include('roles')
    end

    it 'extracts local compare locals' do
      ast = parser.build('domain_id:%(domain.id)s')
      expect(parser.extract_locals(ast)).to include('domain_id')
    end

    it 'extracts locals from compound expressions' do
      ast = parser.build('role:admin and domain_id:default or project_id:%(project.id)s')
      locals = parser.extract_locals(ast)
      expect(locals).to include('roles', 'domain_id', 'project_id')
    end

    it 'returns empty for rule references' do
      ast = parser.build('rule:admin_required')
      expect(parser.extract_locals(ast)).to eq([])
    end
  end

  describe '.extract_params' do
    it 'extracts param paths' do
      ast = parser.build('domain_id:%(domain.id)s')
      expect(parser.extract_params(ast)).to include('domain.id')
    end

    it 'does not extract from literal comparisons' do
      ast = parser.build('domain_id:default')
      expect(parser.extract_params(ast)).to eq([])
    end

    it 'extracts multiple params from compound expressions' do
      ast = parser.build('domain_id:%(domain.id)s and project_id:%(project.id)s')
      params = parser.extract_params(ast)
      expect(params).to include('domain.id', 'project.id')
    end
  end

  describe 'policy file compatibility' do
    it 'parses all rules from the test policy file without errors' do
      policy_file = File.expand_path('../../../../spec/config/policy_test.json', __dir__)
      policy = JSON.parse(File.read(policy_file))

      policy.each do |name, rule|
        expect { parser.build(rule) }.not_to raise_error, "Failed to parse rule '#{name}': #{rule}"
      end
    end
  end
end
