# To build the image locally run from repository root: docker build -t elektra-prod --build-arg "NPM_GITHUB_TOKEN=XXX" --progress=plain -f docker/Dockerfile .
# the NPM_GITHUB_TOKEN is needed to install npm packages from github you can create your own token here:
# 1. logon to github
# 2. go to settings
# 3. go to developer settings
# 4. go to personal access tokens
# 5. click on generate new token
# 6. select the scopes you need (repo, read:packages, write:packages)
# 7. click on generate token
# 8. copy the token and use it as NPM_GITHUB_TOKEN

# for vulnerability scan the image run: trivy image elektra-prod --scanners vuln

# Note: in case you get an error that the image cannot be pulled logon to keppel
# You can also pull the image manually: docker pull keppel.eu-de-1.cloud.sap/ccloud-dockerhub-mirror/library/ruby:3.2.5-alpine3.20

# check for latest version https://hub.docker.com/_/ruby/tags
FROM keppel.eu-de-1.cloud.sap/ccloud-dockerhub-mirror/library/ruby:3.4.5-alpine3.22 AS base 
LABEL source_repository="https://github.com/sapcc/elektra"

ENV APP_PATH=/home/app
ENV RAILS_ENV=production
ARG MONSOON_LOB_LIST
ENV MONSOON_LOB_LIST=$MONSOON_LOB_LIST
ARG MONSOON_NEW_PROJECT_DL
ENV MONSOON_NEW_PROJECT_DL=$MONSOON_NEW_PROJECT_DL

# We use dummy master.key to workaround the fact that
# assets:precompile needs them but we don't want the real master.key to be built
# into the container. The MONSOON_RAILS_SECRET_TOKEN should be injected as env var when starting the
# container.
# https://github.com/rails/rails/issues/32947
ENV MONSOON_RAILS_SECRET_TOKEN=dummy_monsoon_rails_build_secret_token_for_assets_precompiling_change_it_in_production

WORKDIR $APP_PATH

# upgrade packages since based image is used to build elektra
RUN apk upgrade --no-cache --no-progress \
    && apk --no-cache add dumb-init tzdata postgresql16-client

################################### BUILDER ################################
FROM base AS builder 

RUN apk --no-cache add git curl nodejs yarn shared-mime-info build-base

# Install gems with native extensions before running bundle install
# This avoids recompiling them everytime the Gemfile.lock changes.
# The versions need to be kept in sync with the Gemfile.lock
RUN apk --no-cache add postgresql16-dev ruby-sassc \
    && \ 
    gem install --no-document \
    bundler:2.3.20 \
    byebug:11.1.3 \
    ffi:1.15.5 \
    nio4r:2.7.1 \
    nokogiri:1.18.7 \
    pg:1.3.4 \
    puma:6.4.2  \
    redcarpet:3.6.0 \
    unf:0.2.0.beta2 \
    websocket-driver:0.7.6 \
    bindex:0.8.1 \
    sassc:2.4.0 

# add Gemfile and Gemfile.lock to $APP_PATH/
ADD Gemfile Gemfile.lock ./

# add package.json yarn.lock to $APP_PATH
ADD package.json yarn.lock ./

# copy all gemspec files from plugins folder into $APP_PATH/tmp/plugins/
ADD plugins/*/*.gemspec tmp/plugins/

# copy organize_plugins_gemspecs script (see comments in script/organize_plugins_gemspecs) and execute it
ADD script/organize_plugins_gemspecs script/
RUN script/organize_plugins_gemspecs

# install gems
RUN apk --no-cache add yaml-dev \
    && bundle config set --local without 'development integration_tests' \
    && bundle install --jobs=$(nproc)

# add elektra sources into image
ARG NPM_GITHUB_TOKEN
# Set the GITHUB_TOKEN environment variable
ENV GITHUB_TOKEN=$NPM_GITHUB_TOKEN
ADD . $APP_PATH

# Copy .npmrc.sample file into the container
ADD .npmrc.sample .npmrc
# Replace the $GITHUB_TOKEN placeholder with the actual token value
# this is needed to install npm packages from github
# the sed is needed because Docker doesn’t expand environment variables in .npmrc files directly, 
# so writing $GITHUB_TOKEN in the .npmrc file won’t automatically replace it with the environment variable at build time.
RUN sed -i "s|\$GITHUB_TOKEN|$GITHUB_TOKEN|g" .npmrc

# transpile javascripts
# this is needed because some juno packages have unnecessary node checks
RUN yarn config set ignore-engines true
# this step is no longer needed since the rails assets:precompile step will do it for us
# RUN yarn install --no-progress && yarn build --production && rm -rf node_modules
RUN bin/rails assets:precompile && rm -rf node_modules

RUN echo $(git rev-parse HEAD) > $APP_PATH/REVISION && rm -rf .git

######################################### FINAL IMAGE ######################################
FROM base AS elektra

# Copy the already built bundler artifact
COPY --from=builder /usr/local/bundle/ /usr/local/bundle/
# Copy the already built js artifact
COPY --from=builder $APP_PATH $APP_PATH

RUN apk --no-cache add curl libsass-dev ca-certificates
RUN curl -fL http://aia.pki.co.sap.com/aia/SAP%20Global%20Root%20CA.crt -o /usr/local/share/ca-certificates/SAP_Global_Root_CA.crt && \
    update-ca-certificates

# Note: in our k8s this will be overwriten from deployment
ENTRYPOINT ["dumb-init", "-c", "--" ]
CMD ["script/start.sh"]

