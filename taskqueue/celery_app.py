import os
from celery import Celery

user = os.environ.get("RABBITMQ_USER")
password = os.environ.get("RABBITMQ_PASS")

if not user or not password:
    raise ValueError(
        "Please set env variables RABBITMQ_USER and RABBITMQ_PASS")


app = Celery(
    'taskqueue',
    broker='amqp://{}:{}@rabbit:5672'.format(user, password),
#    backend='rpc://',
    backend='redis://redis:6379/0',
    include=['taskqueue.tasks'],
)
