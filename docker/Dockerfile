# To build the image locally run from repository root: docker build -t elektra-prod --build-arg "GITHUB_TOKEN=XXX" --progress=plain -f docker/Dockerfile .
# the GITHUB_TOKEN is needed to install npm packages from github and to clone
# git-based gems (e.g. elektron) from github. you can create your own token here:
# 1. logon to github
# 2. go to settings
# 3. go to developer settings
# 4. go to personal access tokens
# 5. click on generate new token
# 6. select the scopes you need (repo, read:packages, write:packages)
# 7. click on generate token
# 8. copy the token and use it as GITHUB_TOKEN

# for vulnerability scan the image run: trivy image elektra-prod --scanners vuln

# Note: in case you get an error that the image cannot be pulled logon to keppel
# You can also pull the image manually: docker pull keppel.eu-de-1.cloud.sap/ccloud-dockerhub-mirror/library/ruby:3.2.5-alpine3.20

# check for latest version https://hub.docker.com/_/ruby/tags
FROM keppel.eu-de-1.cloud.sap/ccloud-dockerhub-mirror/library/ruby:3.4.8-alpine3.22 AS base 
LABEL source_repository="https://github.com/SAP-cloud-infrastructure/elektra"

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

RUN apk --no-cache add git curl nodejs pnpm shared-mime-info build-base

# Install gems with native extensions before running bundle install
# This avoids recompiling them everytime the Gemfile.lock changes.
# The versions need to be kept in sync with the Gemfile.lock
# check also with "bundler info <gemname>"
RUN apk --no-cache add postgresql16-dev ruby-sassc \
    && \ 
    gem install --no-document \
    byebug:12.0.0 \
    ffi:1.17.2 \
    nio4r:2.7.5 \
    nokogiri:1.19.1 \
    pg:1.3.4 \
    puma:7.2.1  \
    redcarpet:3.6.1 \
    unf:0.2.0 \
    websocket-driver:0.8.0 \
    bindex:0.8.1 \
    sassc:2.4.0 

# add Gemfile and Gemfile.lock to $APP_PATH/
ADD Gemfile Gemfile.lock ./

# add package.json pnpm-lock.yaml to $APP_PATH
ADD package.json pnpm-lock.yaml ./

# copy all gemspec files from plugins folder into $APP_PATH/tmp/plugins/
ADD plugins/*/*.gemspec tmp/plugins/

# copy organize_plugins_gemspecs script (see comments in script/organize_plugins_gemspecs) and execute it
ADD script/organize_plugins_gemspecs script/
RUN script/organize_plugins_gemspecs

# The elektron gem is pulled from a public GitHub repo via `git` (see Gemfile).
# Anonymous git clones are rate-limited by GitHub; when the limit is hit the
# clone falls back to an interactive credential prompt and fails in CI with
# "could not read Username for 'https://github.com'". When a GITHUB_TOKEN is
# provided, authenticate the clone so it counts against the higher
# authenticated rate limit. The "x-access-token" username is a generic
# placeholder; GitHub only evaluates the token, so any valid GITHUB_TOKEN works
# (not tied to a specific bot account). Without a token the clone falls back to
# an anonymous clone, so local builds work without credentials.
ARG GITHUB_TOKEN
# install gems
RUN apk --no-cache add yaml-dev \
    && if [ -n "$GITHUB_TOKEN" ]; then \
         git config --global url."https://x-access-token:${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"; \
       fi \
    && bundle config set --local without 'development integration_tests' \
    && bundle install --jobs=$(nproc) \
    && if [ -n "$GITHUB_TOKEN" ]; then \
         git config --global --unset url."https://x-access-token:${GITHUB_TOKEN}@github.com/".insteadOf; \
       fi

# add elektra sources into image
# Set the GITHUB_TOKEN environment variable
ENV GITHUB_TOKEN=$GITHUB_TOKEN
ADD . $APP_PATH

# Copy .npmrc.sample file into the container
ADD .npmrc.sample .npmrc
# Replace the $GITHUB_TOKEN placeholder with the actual token value
# this is needed to install npm packages from github (@sapcc/* private packages)
# the sed is needed because Docker doesn’t expand environment variables in .npmrc files directly,
# so writing $GITHUB_TOKEN in the .npmrc file won’t automatically replace it with the environment variable at build time.
RUN sed -i "s|\$GITHUB_TOKEN|$GITHUB_TOKEN|g" .npmrc

# Precompile Rails assets (this uses pnpm which needs .npmrc for @sapcc/* packages)
RUN bin/rails assets:precompile && rm -rf node_modules

# Security: Remove .npmrc containing the GitHub token after assets are compiled
# The token is only needed during build, not in the final image
# This prevents the token from being exposed in the image layers
RUN rm -f .npmrc

# Security: Unset the GITHUB_TOKEN environment variable after build
# The token was only needed for pnpm install and should not persist in the image
ENV GITHUB_TOKEN=

RUN echo $(git rev-parse HEAD) > $APP_PATH/REVISION && rm -rf .git

######################################### FINAL IMAGE ######################################
FROM base AS elektra

# Copy the already built bundler artifact
COPY --from=builder /usr/local/bundle/ /usr/local/bundle/
# Copy the already built js artifact
COPY --from=builder $APP_PATH $APP_PATH

RUN apk --no-cache add curl libsass-dev ca-certificates
# Install SAP Global Root CA certificate to trust SAP internal resources
RUN curl -fL https://aia.pki.co.sap.com/aia/SAP%20Global%20Root%20CA.crt -o /usr/local/share/ca-certificates/SAP_Global_Root_CA.crt && \
    update-ca-certificates

# to upgrade the image to the latest
# this is used to ensure all packages are up to date and vulnerable packages are fixed
RUN apk update && apk upgrade

# Note: in our k8s this will be overwriten from deployment
ENTRYPOINT ["dumb-init", "-c", "--" ]
CMD ["script/start.sh"]

