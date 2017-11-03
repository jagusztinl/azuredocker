FROM python:3
ENV PYTHONUNBUFFERED 1
RUN mkdir /code
WORKDIR /code
ADD requirements.txt /code/
RUN pip install -r requirements.txt
ADD . /code/
RUN adduser --uid 1000 --disabled-password --gecos '' django && chown -R django:django /code
USER django
