#!/usr/bin/env python3

from defusedxml import ElementTree as ET
from dateutil import parser
import calendar

NS = "{http://www.topografix.com/GPX/1/1}"
TAG_GPX = NS + "gpx"


def timestamp_to_epoch(ts):
    dt = parser.parse(ts)
    return calendar.timegm(dt.timetuple())


def point_to_dict(pt):
    epoch = None

    assert(pt.tag == NS + "trkpt")
    time_el = pt.find(NS + 'time')
    if time_el is not None:
        timestamp_to_epoch(time_el.text)
    else:
        raise ValueError("No time tag found")

    return {
        "ts": epoch,
        "lat": float(pt.get('lat')),
        "long": float(pt.get('lon')),
        "acc": None,
        "bear": None,
        "speed": None,
    }


def segment_to_json(segment):
    return [point_to_dict(pt) for pt in segment]


def blob_to_dict(blob):
    try:
        root = ET.fromstring(blob)
    except ET.ParseError:
        return TypeError("Not a GPX file")

    if (root.tag != TAG_GPX):
        return TypeError("Not a GPX file")

    segments = root.findall("./" + NS + "trk/" + NS + "trkseg")

    dicts = [segment_to_json(s) for s in segments]

    return dicts


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: {} <gpxfile>".format(sys.argv[0]))
        sys.exit(1)
    with open(sys.argv[1]) as f:
        blob = f.read()

    blob_to_dict(blob)
