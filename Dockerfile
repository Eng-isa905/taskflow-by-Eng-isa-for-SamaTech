FROM node:20-alpine

ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/app/data/taskflow.sqlite

WORKDIR /app

# better-sqlite3 has a native component, so build tools are needed during npm install.
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && apk add --no-cache tini \
    && mkdir -p /app/data \
    && chown -R node:node /app

COPY --chown=node:node package*.json ./
USER node
RUN npm install --omit=dev --no-audit --no-fund

COPY --chown=node:node db.js server.js session-store.js ./
COPY --chown=node:node routes ./routes
COPY --chown=node:node middleware ./middleware
COPY --chown=node:node public ./public
COPY --chown=node:node tests ./tests

USER root
RUN apk del .build-deps && chown -R node:node /app
USER node

EXPOSE 3000
STOPSIGNAL SIGTERM
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
