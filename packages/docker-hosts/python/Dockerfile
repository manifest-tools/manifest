FROM python:3.8

RUN pip install grpcio-tools

ENV NODE_PATH="$NODE_PATH:/usr/local/share/.config/yarn/global/node_modules"
ENV PATH="$PATH:/usr/local/share/.config/yarn/global/node_modules/.bin"

# TODO: all ^^^ above in a host image and FROM it

WORKDIR /usr/src/grpc/service

COPY . .

RUN pip install -r requirements.txt

CMD [ "npm", "start" ]
