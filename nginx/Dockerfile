FROM nginx:latest
ARG HTPASSWD
ENV HTPASSWD=${HTPASSWD}
RUN rm -rf /etc/nginx/conf.d
ADD conf.d /etc/nginx/conf.d
RUN echo "${HTPASSWD}" > /etc/nginx/.htpasswd