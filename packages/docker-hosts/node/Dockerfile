FROM node:12

RUN yarn global add \
  @grpc/proto-loader \
  grpc \
  grpc-tools

ENV NODE_PATH="$NODE_PATH:/usr/local/share/.config/yarn/global/node_modules"
ENV PATH="$PATH:/usr/local/share/.config/yarn/global/node_modules/.bin"

# TODO: all ^^^ above in a host image and FROM it

WORKDIR /usr/src/grpc/service

COPY . .

RUN yarn

CMD [ "npm", "start" ]
