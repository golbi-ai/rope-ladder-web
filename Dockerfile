# syntax=docker/dockerfile:1
FROM --platform=$BUILDPLATFORM node:20-alpine AS web
WORKDIR /src/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM --platform=$BUILDPLATFORM golang:1.25-alpine AS build
WORKDIR /src
COPY go.mod go.sum* ./
RUN go mod download 2>/dev/null; true
COPY . ./
COPY --from=web /src/web/dist/client ./web/dist/client
ARG TARGETARCH
RUN CGO_ENABLED=0 GOOS=linux GOARCH=$TARGETARCH go build -trimpath -ldflags="-s -w" -o /rope-ladder-web .

FROM gcr.io/distroless/static-debian12:nonroot
EXPOSE 8080
COPY --from=build /rope-ladder-web /rope-ladder-web
ENTRYPOINT ["/rope-ladder-web"]
