FROM ruby:2.4-alpine3.7 AS elektra

ENV OVERLAY=sucks2

RUN apk --no-cache add git curl tzdata nodejs postgresql-client yarn

# Install gems with native extensions before running bundle install
# This avoids recompiling them everytime the Gemfile.lock changes.
# The versions need to be kept in sync with the Gemfile.lock
RUN apk --no-cache add build-base postgresql-dev --virtual .builddeps \
      && gem install byebug -v 9.0.6 \
      && gem install ffi -v 1.9.18 \
      && gem install json -v 1.8.6 \
      && gem install nio4r -v 2.1.0 \
      && gem install nokogiri -v 1.8.4 \
      && gem install pg -v 0.21.0 \
      && gem install puma -v 3.9.1  \
      && gem install redcarpet -v 3.4.0 \
      && gem install unf -v 0.2.0.beta2 \
      && gem install websocket-driver -v 0.6.5 \
      && runDeps="$( \
		      scanelf --needed --nobanner --recursive /usr/local \
            | awk '{ gsub(/,/, "\nso:", $2); print "so:" $2 }' \
            | sort -u \
            | xargs -r apk info --installed \
            | sort -u \
          )" \
      && apk add --virtual .rundeps $runDeps \
      && apk del .builddeps \
      && gem sources -c \
      && rm -f /usr/local/bundle/cache/*

RUN curl -L -o /usr/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 && \
    chmod +x /usr/bin/dumb-init && \
    dumb-init -V

WORKDIR /home/app/webapp
ENV RAILS_ENV=production

# RUN gem install bundler 1.16.0

# add Gemfile and Gemfile.lock to /home/app/webapp/
ADD Gemfile Gemfile.lock ./

# add package.json yarn.lock to /home/app/webapp
ADD package.json yarn.lock ./

# copy all gemspec files from plugins folder into /home/app/webapp/tmp/plugins/
ADD plugins/*/*.gemspec tmp/plugins/

# copy organize_plugins_gemspecs script (see comments in docker/organize_plugins_gemspecs) and execute it
ADD script/organize_plugins_gemspecs script/
RUN script/organize_plugins_gemspecs

ARG ELEKTRA_EXTENSION=false
ENV ELEKTRA_EXTENSION=$ELEKTRA_EXTENSION
# Install the SAP Global Root CA if ELEKTRA_EXTENSION is set
RUN if [ "$ELEKTRA_EXTENSION" = "true" ]; then \
      curl -fL http://aia.pki.co.sap.com/aia/SAP%20Global%20Root%20CA.crt | tr -d '\r' > /usr/local/share/ca-certificates/SAP_Global_Root_CA.crt \
      && update-ca-certificates \
      && ruby -ropen-uri -e 'open("https://github.wdf.sap.corp").read' \
      ; fi

# install gems, copy app and run rake tasks
RUN bundle install --without "development integration_tests"
# install js packages
RUN if [ -z ${http_proxy} ]; then \
      echo do not use proxy && yarn; \
      else echo use proxy && yarn --proxy $http_proxy --https-proxy $https_proxy; fi

ADD . /home/app/webapp

RUN bundle binstubs bundler --force
# create webpacker binstubs
RUN bundle binstubs webpacker --force --path ./bin
# precompile assets including webpacker packs
RUN bin/rails assets:precompile && rm -rf tmp/cache/assets

ENTRYPOINT ["dumb-init", "-c", "--" ]
CMD ["script/start.sh"]

FROM elektra AS tests
RUN apk add --no-cache postgresql bash
ENV RAILS_ENV=test
RUN LISTENTO=127.0.0.1 su postgres -c 'script/pg_tmp.sh -p 5432 -w 300 -d /tmp/pg start' \
      && rake db:create db:migrate \
      && bundle exec rspec \
      && su postgres -c 'script/pg_tmp.sh -d /tmp/pg stop'

FROM elektra
