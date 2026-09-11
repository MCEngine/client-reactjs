# syntax=docker/dockerfile:1

# The MCPluginManager web panel.
#
# nginx serves the built bundle *and* proxies /api to the central server. That
# is not an optional convenience: the panel's requests are relative, because its
# refresh token is an HttpOnly cookie and a second origin would make every
# request cross-site in production while the dev proxy keeps it same-site -- a
# difference that surfaces only as a cookie the browser declines to send.
ARG NODE_VERSION=22-bookworm-slim
ARG NGINX_VERSION=1.27-alpine

# ---------------------------------------------------------------------------
# Build: typecheck, then Vite.
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src

# Vite inlines every VITE_-prefixed value into the bundle at build time, so
# these are build arguments rather than runtime environment. Nothing secret may
# be passed here: whatever is inlined ships to every browser that loads the
# page. Empty means same-origin, which is what the topology below provides.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# `npm run build` is `tsc --noEmit && vite build`, so a type error fails the
# image rather than shipping a bundle nobody typechecked.
#
# `test/` is not in the build context, so that typecheck covers `src` and
# `vite.config.ts` -- everything that reaches the bundle -- and not the suites.
# That is deliberate: a test file cannot affect the artifact, and copying the
# suites in would invalidate this layer on every test edit for no change in
# output. `npm run check` is the repository's gate and covers both.
RUN npm run build

# ---------------------------------------------------------------------------
# Runtime: nginx, unprivileged.
# ---------------------------------------------------------------------------
#
# nginxinc/nginx-unprivileged is the nginx team's own image: uid 101, no root
# anywhere, and the same configuration and template handling as the official
# one. Listening on 8080 is the consequence of that -- an unprivileged process
# cannot bind a port below 1024.
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION} AS runtime

# Where the panel sends /api. The base image runs envsubst over
# /etc/nginx/templates/*.template at start-up, so this is set per container
# rather than baked in at build. It may carry a scheme -- https:// reaches an
# API that has no private address, such as a free-tier service on a host that
# lets one send private traffic but not receive it.
#
# DNS_RESOLVER is deliberately *not* defaulted here. It used to be 127.0.0.11,
# Docker's embedded DNS, which answers on a Docker network and nowhere else --
# and nginx needs a resolver for the variable proxy_pass below, so on any other
# platform every proxied request ran to timeout and returned 502 from a healthy
# API. Left unset, the entrypoint script takes it from /etc/resolv.conf like
# every other program on the machine. Set it to override that.
ENV API_UPSTREAM=server:3000

# --chmod because the entrypoint skips a file in /docker-entrypoint.d/ that is
# not executable, and the image is unprivileged by then -- there is no root left
# to chmod it afterwards.
COPY --chmod=0755 docker/10-api-upstream.envsh /docker-entrypoint.d/10-api-upstream.envsh
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# wget is in the Alpine base, unlike the Node images. --spider makes it a HEAD
# request that writes nothing.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:8080/ || exit 1
