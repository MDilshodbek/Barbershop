# syntax=docker/dockerfile:1

# One image for both apps (barbershop API + barbershop-batch); docker-compose.yml picks the entry file.
ARG NODE_VERSION=20

# ---------- Build stage: full dependencies + compile ----------
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /usr/src/barbershop

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Production stage: runtime dependencies + compiled output only ----------
FROM node:${NODE_VERSION}-alpine AS production
ENV NODE_ENV=production
WORKDIR /usr/src/barbershop

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /usr/src/barbershop/dist ./dist

# Upload folders the API writes to (mounted as a volume in production)
RUN mkdir -p uploads/article uploads/member uploads/review uploads/service \
	&& chown -R node:node uploads

# Built-in non-root user from the official Node image (uid 1000)
USER node

EXPOSE 3007 3008

CMD ["node", "dist/apps/barbershop/main"]
