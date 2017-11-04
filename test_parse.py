import json
from django.test import TestCase

from procs.location_csv import blob_to_dict
from collector.models import File, JsonData
from collector import filehandler


class ParseTest(TestCase):
    def setUp(self):
        data = """1420567692000,52.520044,13.421843,15.000000,117.099998,5.000000
1420567721000,52.519772,13.422634,24.000000,111.500000,0.500000
1420567722000,52.519798,13.422484,19.000000,111.500000,0.500000
1420567723000,52.519855,13.422495,12.000000,111.500000,0.500000
1420567724000,52.519881,13.422457,10.000000,111.500000,0.250000"""

        File.objects.create(
            name='location_2015-01-08 23_21_33 - 2015-01-08 23_21_39 (4).csv',
            data=bytes(data, 'utf-8'),
            size=len(data)
        )

    def test_parse(self):
        f = File.objects.first()
        blob = str(f.data.tobytes(), 'utf-8')
        ret = blob_to_dict(blob)
        self.assertEquals(len(ret), 5)
        row = ret[0]
        self.assertEquals(
            sorted(row.keys()),
            sorted(['ts', 'lat', 'long', 'acc', 'bear', 'speed']))

    def test_process_file(self):
        """ Test the filehandler process file method """
        jd = JsonData.objects.all()
        self.assertEquals(len(jd), 0)
        file_id = File.objects.first().id

        success = filehandler.process_file(file_id)
        self.assertTrue(success)
        jd = JsonData.objects.all()
        self.assertEquals(len(jd), 1, 'There should be one entry')


if __name__ == '__main__':
    TestCase.run()