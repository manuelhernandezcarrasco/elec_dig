FROM node:16

RUN apt-get update && \
    apt-get install -y mosquitto-clients

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG DATABASE_URL
ARG BROKER_SERVER

ENV DATABASE_URL=${DATABASE_URL}
ENV BROKER_SERVER=${BROKER_SERVER}
ENV PORT="8080"

EXPOSE 8080

CMD ["npm", "run", "deploy"]
