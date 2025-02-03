FROM alpine:3.19

RUN  apk add --no-cache nginx openssl

RUN mkdir -p /etc/nginx/ssl \
	&& openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
	-keyout /etc/nginx/ssl/self_signed.key \
	-out /etc/nginx/ssl/self_signed.crt \
	-subj "/C=FR/ST=France/L=Nice/O=42/CN=localhost"

COPY ./conf/nginx.conf /etc/nginx/nginx.conf

COPY tools/start_nginx.sh /start_nginx.sh

RUN chmod +x /start_nginx.sh

EXPOSE 443

ENTRYPOINT ["/start_nginx.sh"]

CMD ["nginx", "-g", "daemon off;"]
