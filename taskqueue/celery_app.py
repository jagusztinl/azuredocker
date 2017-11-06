from celery import Celery

app = Celery(
    'taskqueue',
    broker='amqp://admin:kanin@rabbit:5672',
#    backend='rpc://',
    backend='redis://redis:6379/0',
    include=['taskqueue.tasks'],
)
