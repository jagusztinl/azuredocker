import json
from django.test import (
    TestCase,
    Client,
)
from django.contrib.auth.models import User
from collector.models import (
    File,
)

def dodir(res):
    for key in dir(res):
        if not key.startswith("_"):
            print("{} -> {}".format(key, getattr(res, key)))





class APITest(TestCase):
    USERNAME = "admin"
    PASSWORD = "kalleanka123"

    def setUp(self):
        self.user = User.objects.create_user(
            username=self.USERNAME,
            password=self.PASSWORD,
            is_superuser=True
        )
        self.client = Client()

    def get_json_200(self, url):
        res = self.client.get(url)
        self.assertEquals(res.status_code, 200)
        try:
            return json.loads(res.content)
        except Exception:
            print("Content is: {}".format(res.content))
            raise

    def login(self):
        return self.client.login(
            username=self.USERNAME,
            password=self.PASSWORD,
        )

    def insertFile(self):
        data = """1420567692000,52.520044,13.421843,15.000000,117.099998,5.000000
1420567721000,52.519772,13.422634,24.000000,111.500000,0.500000
1420567722000,52.519798,13.422484,19.000000,111.500000,0.500000
1420567723000,52.519855,13.422495,12.000000,111.500000,0.500000
1420567724000,52.519881,13.422457,10.000000,111.500000,0.250000"""

        File.objects.create(
            name='file_{}.csv'.format(File.objects.count() + 1),
            data=bytes(data, 'utf-8'),
            owner_id=self.user.id,
        )

    def test_login(self):
        """Test login"""
        client = Client()
        API_FILES ="/API/files/"
        res = client.get(API_FILES)
        # Login redirect
        self.assertEquals(res.status_code, 302)

        res = client.post(res.url, {
            "username": self.USERNAME,
            "password": self.PASSWORD,

        })
        self.assertEquals(res.status_code, 302)
        self.assertEquals(res.url, API_FILES)

        res = client.get(API_FILES)
        self.assertEquals(res.status_code, 200)

    def test_get_files(self):
        """Should get a file list and single file"""
        self.insertFile()
        self.login()
        c = self.client

        res = c.get("/API/files/")
        self.assertEquals(res.status_code, 200)
        files = json.loads(res.content)
        self.assertEquals(len(files), 1)
        file_id = files[0]['id']

        res = c.get("/API/files/{}".format(file_id))
        self.assertEquals(res.status_code, 200)
        single_file = json.loads(res.content)
        self.assertTrue(single_file['data_url'].endswith(
            "/files/{}/data".format(file_id)))

    def test_delete_file(self):
        """Should delete the correct file"""
        c = self.client
        self.login()
        self.insertFile()
        self.insertFile()

        res = c.get("/API/files/")
        self.assertEquals(res.status_code, 200)
        files = json.loads(res.content)
        self.assertEquals(len(files), 2)

        file_id = files[-1]['id']

        res = c.delete("/API/files/{}".format(file_id))
        self.assertEquals(res.status_code, 200)

        files = self.get_json_200("/API/files/")
        self.assertEquals(len(files), 1)

        res = c.get("/API/files/{}".format(file_id))
        self.assertEquals(res.status_code, 404)

    def test_upload_file(self):
        """Upload a file"""
        self.login()
        c = self.client

        files = self.get_json_200("/API/files/")
        self.assertEquals(len(files), 0)

        with open("./fixtures/file1.csv") as f:
            res = c.post('/API/files/', { "file": f})

        self.assertEquals(res.status_code, 200)
        j = json.loads(res.content)
        self.assertTrue(j.get('success'))
        self.assertEquals(len(j.get('files')), 1)

        files = self.get_json_200("/API/files/")
        self.assertEquals(len(files), 1)

    def test_upload_multiple_files(self):
        """Upload a file"""
        self.login()
        c = self.client

        files = self.get_json_200("/API/files/")
        self.assertEquals(len(files), 0)

        with open("./fixtures/file1.csv") as f1:
            with open("./fixtures/file2.csv") as f2:
                res = c.post('/API/files/', { "file1": f1, "file2": f2})

        self.assertEquals(res.status_code, 200)
        j = json.loads(res.content)
        self.assertTrue(j.get('success'))
        self.assertEquals(len(j.get('files')), 2)

        files = self.get_json_200("/API/files/")
        self.assertEquals(len(files), 2)


        # Upload multiple files



if __name__ == '__main__':
    TestCase.run()