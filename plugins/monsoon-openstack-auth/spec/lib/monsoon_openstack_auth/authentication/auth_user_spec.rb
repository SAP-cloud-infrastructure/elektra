require 'spec_helper'

describe MonsoonOpenstackAuth::Authentication::AuthUser do
  shared_examples_for "an user" do
    describe "initialize" do
      it "should create a new user object from token" do
        user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token)
        expect(user).not_to be(nil)
      end
    end

    context "User initialized" do
      let(:user) {user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token)}

      describe "id" do
        it "should return id" do
          expect(user.id).to eq(token["user"]["id"])
        end
      end

      describe "token" do
        it "should return token" do
          expect(user.token).to eq(token["value"])
        end
      end

      describe "name" do
        it "should return name" do
          expect(user.name).to eq(token["user"]["name"])
        end
      end

      describe "description" do
        it "should return description" do
          expect(user.description).to eq(token["user"]["description"])
        end
      end

      describe "user_domain_id" do
        it "should return user domain id" do
          user_domain_id = begin token["user"]["domain"]["id"]; rescue; nil; end

          if user_domain_id
            expect(user.user_domain_id).to eq(user_domain_id)
          else
            new_user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token.merge({"user"=>{"domain"=>{"id" => "test"} } }))
            expect(new_user.user_domain_id).to eq("test")
          end
        end
      end

      describe "user_domain_name" do
        it "should return user domain name" do
          user_domain_name = begin token["user"]["domain"]["name"]; rescue; nil; end

          if user_domain_name
            expect(user.user_domain_name).to eq(user_domain_name)
          else
            new_user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token.merge({"user"=>{"domain"=>{"name" => "test"} } }))
            expect(new_user.user_domain_name).to eq("test")
          end
        end
      end

      describe "domain_id" do
        it "should return domain_id" do
          domain_id = begin token["domain"]["id"]; rescue; nil; end

          if domain_id
            expect(user.domain_id).to eq(domain_id)
          else
            new_user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token.merge({"domain"=>{"id" => "test"} } ))
            expect(new_user.domain_id).to eq("test")
          end
        end
      end

      describe "domain_name" do
        it "should return domain_name" do
          domain_name = begin token["domain"]["name"]; rescue; nil; end

          if domain_name
            expect(user.domain_name).to eq(domain_name)
          else
            new_user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token.merge({"domain"=>{"name" => "test"} } ))
            expect(new_user.domain_name).to eq("test")
          end
        end
      end

      describe "project_id" do
        it "should return project_id" do
          project_id = begin token["project"]["id"]; rescue; nil; end

          if project_id
            expect(user.project_id).to eq(project_id)
          else
            new_user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token.merge({"project"=>{"id" => "test"} } ))
            expect(new_user.project_id).to eq("test")
          end
        end
      end

      describe "project_name" do
        it "should return project_name" do
          project_name = begin token["project"]["name"]; rescue; nil; end

          if project_name
            expect(user.project_name).to eq(project_name)
          else
            new_user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token.merge({"project"=>{"name" => "test"} } ))
            expect(new_user.project_name).to eq("test")
          end
        end
      end

      describe "project_parent_id" do
        it "should return project_parent_id" do
          project_parent_id = begin token["project"]["parent_id"]; rescue; nil; end

          if project_parent_id
            expect(user.project_parent_id).to eq(project_parent_id)
          else
            new_user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token.merge({"project"=>{"parent_id" => "test"} } ))
            expect(new_user.project_parent_id).to eq("test")
          end
        end
      end

      describe "project_domain_id" do
        it "should return project_id" do
          project_domain_id = begin token["project"]["domain"]["id"]; rescue; nil; end

          if project_domain_id
            expect(user.project_domain_id).to eq(project_domain_id)
          else
            new_user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token.merge({"project"=>{"id" => "test", "domain"=> {"id"=>"test"} } } ))
            expect(new_user.project_domain_id).to eq("test")
          end
        end
      end

      describe "project_domain_name" do
        it "should return project_name" do
          project_domain_name = begin token["project"]["domain"]["name"]; rescue; nil; end

          if project_domain_name
            expect(user.project_domain_name).to eq(project_domain_name)
          else
            new_user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token.merge({"project"=>{"name" => "test", "domain"=> {"name"=>"test"} } } ))
            expect(new_user.project_domain_name).to eq("test")
          end
        end
      end

      describe "project_scoped" do
        it "should return project_scoped" do
          project_scoped = begin token["project"]; rescue; nil; end

          if project_scoped
            expect(user.project_scoped).to eq(project_scoped)
          else
            new_user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token.merge({"project"=>{"name" => "test", "domain"=> {"name"=>"test"} } } ))
            expect(new_user.project_scoped).to eq({"name" => "test", "domain"=> {"name"=>"test"} })
          end
        end
      end

      describe "domain_scoped" do
        it "should return domain_scoped" do
          domain_scoped = begin token["domain"]; rescue; nil; end

          if domain_scoped
            expect(user.domain_scoped).to eq(domain_scoped)
          else
            new_user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token.merge({"domain"=>{"name" => "test" } } ))
            expect(new_user.domain_scoped).to eq({"name"=>"test"} )
          end
        end
      end

      describe "token_expires_at" do
        it "should return token_expires_at" do
          expect(user.token_expires_at).to eq(DateTime.parse(token["expires_at"]))
        end
      end

      describe "token_issued_at" do
        it "should return token_issued_at" do
          expect(user.token_issued_at).to eq(DateTime.parse(token["issued_at"]))
        end
      end

      describe "service_catalog" do
        it "should return service_catalog" do
          expect(user.service_catalog).to eq(token["catalog"])
        end
      end

      describe "roles" do
        it "should return roles" do
          expect(user.roles).to eq(token["roles"] || [])
        end
      end

      describe "admin?" do
        it "should returns true or false depends on token roles" do
          is_admin = false
          token["roles"].each{ |hash| is_admin=true if hash["name"]=="admin"}  if token["roles"]

          expect(user.admin?).to eq(is_admin)
        end

        context "token contains admin role" do
          before :each do
            @newtoken = token.clone
            @newtoken["roles"]
          end
          it "should return true" do
            new_user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token.merge({"roles"=>[{"name"=>"admin"}] }))
            expect(new_user.admin?).to eq(true)
          end
        end

        context "token does not contain admin role" do
          it "should return false" do
            new_token = token.clone
            new_token["roles"]=[{"name"=>"member"}]
            new_user = MonsoonOpenstackAuth::Authentication::AuthUser.new(new_token)
            expect(new_user.admin?).to eq(false)
          end
        end
      end

      describe "default_services_region" do
        it "should return the first endpoint region for first non-identity service" do
          services = (token["catalog"] || token["serviceCatalog"] || [])
          region = catch(:found) do
            services.each do |service|
              throw(:found, service["endpoints"].first["region"]) if service["type"]!="identity"
            end
            nil
          end

          expect(user.default_services_region).to eq(region)
        end

        it "should return europe" do
          new_user = MonsoonOpenstackAuth::Authentication::AuthUser.new(token)
          expect(new_user.default_services_region).to eq('europe')
        end
      end

      describe "token_expired?" do
        it "should return false or true depends on token" do
          expires = DateTime.parse(token["expires_at"])
          expect(user.token_expired?).to eq(expires<Time.now)
        end
      end

      describe "available_services_regions" do
        it "should return ['europe','us']" do
          new_token = token.clone
          new_token["catalog"] = [
            {
              "endpoints"=>[
                { "url"=>"http://localhost:5000/v2.0", "region"=>"europe", "interface"=>"public", "id"=>"0b4b1e907e184880a1c3f32f00cd676f" },
                { "url"=>"http://localhost:35357/v2.0", "region"=>"europe", "interface"=>"admin", "id"=>"53d872f1c5d04f35ac69509e41600c0b" },
                { "url"=>"http://localhost:5000/v2.0", "region"=>"europe", "interface"=>"internal", "id"=>"67aa3eedc510444faadb9ef3c7e8b2e4" }
              ],
              "type"=>"compute",
              "id"=>"8e53f1d389df4059aeab1acfece2fc66",
              "name"=>"keystone"
            },
            {
              "endpoints"=>[
                { "url"=>"http://localhost:5000/v3", "region"=>"europe", "interface"=>"internal", "id"=>"7002cfd6dbe74512b0b817d3b7380abb" },
                { "url"=>"http://localhost:5000/v3", "region"=>"europe", "interface"=>"public", "id"=>"a7c634aa7f034284b62ddf974ddc04eb" },
                { "url"=>"http://localhost:35357/v3", "region"=>"europe", "interface"=>"admin", "id"=>"cba56e3e7a9c4ddfb39e1e4053bd04ab" },
                { "url"=>"http://localhost:35357/v3", "region"=>"us", "interface"=>"admin", "id"=>"cba56e3e7a9c4ddfb39e1e4053bd04ab" }
              ],
              "type"=>"glance",
              "id"=>"a47e0f0014fa409993cef0bd984a5ac6",
              "name"=>"identity_v3"
            },
          ]
          new_user = MonsoonOpenstackAuth::Authentication::AuthUser.new(new_token)
          expect(new_user.available_services_regions.sort).to eq(['europe','us'].sort)
        end
      end

      describe "has_role?" do
        before do
          if token['roles'].nil?
            @token = token.clone
            @token['roles'] = [{"name"=>"admin", "id"=>"test"},{"name"=>"member", "id"=>"test"}]
            @user = MonsoonOpenstackAuth::Authentication::AuthUser.new(@token)
            @role = 'admin'
          else
            @token = token
            @user = user
            @role = token['roles'].first['name']
          end
        end

        it "should return true" do
          expect(@user.has_role?(@role)).to eq(true)
        end

        it "should return false" do
          expect(@user.has_role?('xyz')).to eq(false)
        end
      end

      describe "has_service?" do
        before do
          if token['roles'].nil?
            @token = token.clone
            @token['catalog'] = [
              {
                "endpoints"=>[
                  { "url"=>"http://localhost:5000/v2.0", "region"=>"europe", "interface"=>"public", "id"=>"0b4b1e907e184880a1c3f32f00cd676f" },
                  { "url"=>"http://localhost:35357/v2.0", "region"=>"europe", "interface"=>"admin", "id"=>"53d872f1c5d04f35ac69509e41600c0b" },
                  { "url"=>"http://localhost:5000/v2.0", "region"=>"europe", "interface"=>"internal", "id"=>"67aa3eedc510444faadb9ef3c7e8b2e4" }
                ],
                "type"=>"identity",
                "id"=>"8e53f1d389df4059aeab1acfece2fc66",
                "name"=>"keystone"
              },
              {
                "endpoints"=>[
                  { "url"=>"http://localhost:5000/v3", "region"=>"europe", "interface"=>"internal", "id"=>"7002cfd6dbe74512b0b817d3b7380abb" },
                  { "url"=>"http://localhost:5000/v3", "region"=>"europe", "interface"=>"public", "id"=>"a7c634aa7f034284b62ddf974ddc04eb" },
                  { "url"=>"http://localhost:35357/v3", "region"=>"europe", "interface"=>"admin", "id"=>"cba56e3e7a9c4ddfb39e1e4053bd04ab" }
                ],
                "type"=>"glance",
                "id"=>"a47e0f0014fa409993cef0bd984a5ac6",
                "name"=>"glance"
              },
            ]
            @user = MonsoonOpenstackAuth::Authentication::AuthUser.new(@token)
            @type = 'glance'
          else
            @token = token
            @user = user
            @type = token['catalog'].first['type']
          end
        end

        it "should return true" do
          expect(@user.has_service?(@type)).to eq(true)
        end

        it "should return false" do
          expect(@user.has_service?('xyz')).to eq(false)
        end
      end
    end
  end

  context "Keystone" do
    # stubed token
    it_should_behave_like "an user" do
      let(:token) { ApiStub.keystone_token }
    end
  end

  context "Authority" do
    # stubed token
    it_should_behave_like "an user" do
      let(:token) { ApiStub.authority_token }
    end
  end
end
