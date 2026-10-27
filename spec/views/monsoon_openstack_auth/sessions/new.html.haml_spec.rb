# frozen_string_literal: true

require 'spec_helper'

# View spec for the login page partial selection logic.
#
# The page must pick exactly one of three partials, and the order matters:
#   1. federation domains  -> federation (IdP) partial
#   2. password auth off    -> sso_only partial
#   3. otherwise            -> login_form partial
#
# Federation is checked first on purpose: federation domains (e.g. iaas
# domains using Keystone federation) never use password login, so the global
# "password auth disabled" kill switch must not hide their IdP login.
RSpec.describe 'monsoon_openstack_auth/sessions/new.html.haml', type: :view do
  # Render only the page under test by stubbing out the three candidate
  # partials and the surrounding login layout. This keeps the spec focused on
  # the branch selection logic rather than the full layout/ENV/Keystone stack.
  before do
    allow(view).to receive(:inside_layout).and_yield
    stub_template 'monsoon_openstack_auth/sessions/_federation.html.haml' => 'FEDERATION_PARTIAL'
    stub_template 'monsoon_openstack_auth/sessions/_sso_only.html.haml' => 'SSO_ONLY_PARTIAL'
    stub_template 'monsoon_openstack_auth/sessions/_login_form.html.haml' => 'LOGIN_FORM_PARTIAL'

    assign(:domain_name, 'some-domain')

    domain_config = instance_double(DomainConfig, federation?: federation)
    allow(DomainConfig).to receive(:new).with('some-domain').and_return(domain_config)
  end

  context 'when the domain uses federation' do
    let(:federation) { true }

    it 'renders the federation partial even when password auth is disabled' do
      assign(:password_auth_disabled, true)

      render

      expect(rendered).to include('FEDERATION_PARTIAL')
      expect(rendered).not_to include('SSO_ONLY_PARTIAL')
      expect(rendered).not_to include('LOGIN_FORM_PARTIAL')
    end

    it 'renders the federation partial when password auth is enabled' do
      assign(:password_auth_disabled, false)

      render

      expect(rendered).to include('FEDERATION_PARTIAL')
      expect(rendered).not_to include('SSO_ONLY_PARTIAL')
      expect(rendered).not_to include('LOGIN_FORM_PARTIAL')
    end
  end

  context 'when the domain does not use federation' do
    let(:federation) { false }

    it 'renders the sso_only partial when password auth is disabled' do
      assign(:password_auth_disabled, true)

      render

      expect(rendered).to include('SSO_ONLY_PARTIAL')
      expect(rendered).not_to include('FEDERATION_PARTIAL')
      expect(rendered).not_to include('LOGIN_FORM_PARTIAL')
    end

    it 'renders the login_form partial when password auth is enabled' do
      assign(:password_auth_disabled, false)

      render

      expect(rendered).to include('LOGIN_FORM_PARTIAL')
      expect(rendered).not_to include('FEDERATION_PARTIAL')
      expect(rendered).not_to include('SSO_ONLY_PARTIAL')
    end
  end
end
