FROM oven/bun:1.1.22 AS base

WORKDIR /app

FROM base AS install

RUN apt update && apt install -y node-gyp && apt clean

RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY src/ src
COPY package.json .

ENTRYPOINT [ "bun", "." ]