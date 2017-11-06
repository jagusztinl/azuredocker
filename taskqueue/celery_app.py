from celery import Celery

app = Celery(
    'taskqueue',
    broker='amqp://admin:kanin@rabbit:5672',
    backend='rpc://',
    include=['taskqueue.tasks'],
)
