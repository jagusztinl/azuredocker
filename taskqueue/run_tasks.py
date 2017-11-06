from .tasks import blob_to_dict
import time
import sys

blob = """1420567692000,52.520044,13.421843,15.000000,117.099998,5.000000
1420567721000,52.519772,13.422634,24.000000,111.500000,0.500000
1420567722000,52.519798,13.422484,19.000000,111.500000,0.500000
1420567723000,52.519855,13.422495,12.000000,111.500000,0.500000
1420567724000,52.519881,13.422457,10.000000,111.500000,0.250000"""

if __name__ == "__main__":
    id_ = int(sys.argv[1])
    task = blob_to_dict.delay(id_)
    while not task.ready():
        print("Waiting for task...")
        time.sleep(0.1)
    print("task result: {}".format(task.result))