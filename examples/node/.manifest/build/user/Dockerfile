FROM node:12

RUN apt-get update && apt-get install -y supervisor
RUN mkdir -p /var/log/supervisor

RUN printf "[program:grpc] \n\
directory=/usr/src/grpc/service \n\
command=node ./grpc.js\n\
autostart=true\n\
autorestart=true\n\
redirect_stderr=true\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
\n\
[program:rest] \n\
directory=/usr/src/grpc/service \n\
command=node ./rest.js\n\
autostart=true\n\
autorestart=true\n\
redirect_stderr=true\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0" > /etc/supervisor/conf.d/services.conf

RUN yarn global add \
  @grpc/proto-loader \
  grpc \
  grpc-tools \
  express

ENV NODE_PATH="$NODE_PATH:/usr/local/share/.config/yarn/global/node_modules"
ENV PATH="$PATH:/usr/local/share/.config/yarn/global/node_modules/.bin"

# TODO: all ^^^ above in a host image and FROM it

WORKDIR /usr/src/grpc/service

COPY . .

RUN yarn

CMD ["/usr/bin/supervisord", "-n"]
# CMD ["npm", "run", "rest"]
