FROM ubuntu AS builder

RUN apt-get -y update && apt-get -y install curl unzip
RUN cd /tmp
RUN curl https://releases.hashicorp.com/consul/1.7.2/consul_1.7.2_linux_amd64.zip > /tmp/consul.zip
RUN cd /tmp; unzip consul.zip; mv consul /usr/local/bin/

FROM node:12
COPY --from=builder /usr/local/bin/consul /usr/local/bin/
RUN mkdir -p /app
WORKDIR /app
COPY src/package-lock.json src/package.json ./
RUN npm install
COPY src/ ./
ENV CONSUL_HTTP_ADDR http://consul:8500
#ENV CONSUL_PREFIX
RUN ls -la /app
CMD /usr/local/bin/consul watch -type=keyprefix -prefix=${CONSUL_PREFIX} /app/handler.sh
