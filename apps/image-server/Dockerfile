FROM ubuntu:22.04

WORKDIR /bun

RUN apt-get update
RUN apt-get install libjemalloc1 && rm -rf /var/lib/apt/lists/*
ENV LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libjemalloc.so.1
RUN apt-get install curl unzip -y
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install curl unzip nodejs -y
RUN npm install -g pnpm
RUN curl --fail --location --progress-bar --output "/bun/bun.zip" "https://github.com/Jarred-Sumner/bun/releases/download/bun-v0.1.2/bun-linux-x64.zip"
RUN unzip -d /bun -q -o "/bun/bun.zip"
RUN mv /bun/bun-linux-x64/bun /usr/local/bin/bun
RUN chmod 777 /usr/local/bin/bun

WORKDIR /app
RUN addgroup --gid 101 --system appuser && adduser --uid 101 --system appuser
RUN chown -R 101:101 /app && chmod -R g+w /app
USER appuser
COPY . ./

RUN pnpm install
CMD bun start
