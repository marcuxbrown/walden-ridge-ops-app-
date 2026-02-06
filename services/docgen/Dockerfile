FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    pandoc \
    python3 \
    python3-pip \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libffi-dev \
  && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir weasyprint

WORKDIR /app

# tsconfig base is required because services/docgen/tsconfig.json extends it
COPY tsconfig.base.json ./tsconfig.base.json

COPY services/docgen/package*.json ./services/docgen/
RUN cd services/docgen && npm ci

COPY services/docgen ./services/docgen
COPY packages ./packages

RUN cd services/docgen && npm run build

WORKDIR /app/services/docgen
ENV NODE_ENV=production
EXPOSE 4000
CMD ["npm", "start"]
