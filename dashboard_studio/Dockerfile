ARG BUILD_FROM=ghcr.io/hassio-addons/base:15.0.7
FROM ${BUILD_FROM}

RUN apk add --no-cache \
    nodejs \
    npm \
    bash \
    jq

WORKDIR /app

COPY package.json /app/
RUN npm install --omit=dev --no-audit --no-fund

COPY . /app/

RUN chmod a+x /app/run.sh

CMD [ "/app/run.sh" ]
