FROM python:3.8

RUN pip install grpcio-tools starlette uvicorn
RUN apt-get update && apt-get install -y supervisor
RUN mkdir -p /var/log/supervisor

ENV PYTHONPATH="$PYTHONPATH:/usr/src/grpc/service"

RUN printf "[program:grpc] \n\
directory=/usr/src/grpc/service \n\
command=python ./grpc_server.py\n\
autostart=true\n\
autorestart=true\n\
redirect_stderr=true\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0\n\
\n\
[program:rest] \n\
directory=/usr/src/grpc/service \n\
command=python ./rest_server.py\n\
autostart=true\n\
autorestart=true\n\
redirect_stderr=true\n\
stdout_logfile=/dev/stdout\n\
stdout_logfile_maxbytes=0" > /etc/supervisor/conf.d/services.conf

# TODO: all ^^^ above in a host image and FROM it
# FROM manifest-python:3.8

WORKDIR /usr/src/grpc/service

COPY . .

RUN pip install -r requirements.txt

CMD ["/usr/bin/supervisord", "-n"]
