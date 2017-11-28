from django.core.management.base import BaseCommand, CommandError
from collector.models import Track


class Command(BaseCommand):
    help = 'Delete all derived JSON - useful for developing'

#    def add_arguments(self, parser):
#        parser.add_argument('poll_id', nargs='+', type=int)

    def handle(self, *args, **options):
        num_deleted = 0
        num_failed = 0
        for jd in Track.objects.all():
            try:
                jd.delete()
                num_deleted += 1
            except Exception as e:
                self.stderr.write(
                    self.style.WARNING(
                        "Failed deleting Track entry -> {}".format(e)))
                num_failed += 1

        self.stdout.write(
            self.style.SUCCESS(
                'Deleted {} Track objects, {} failed'.format(
                    num_deleted, num_failed)))
