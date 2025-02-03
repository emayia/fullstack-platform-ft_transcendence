#!/bin/sh

while ! nc -z django 8000; do   
  echo "Waiting for Django..."
  sleep 2
done

echo "Django is available, starting NGINX..."
nginx -g 'daemon off;'
