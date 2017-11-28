#!/usr/bin/env python3

from defusedxml import ElementTree as ET
from dateutil import parser
import calendar
import math

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
        epoch = timestamp_to_epoch(time_el.text) * 1000
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


def calculate_bearing(pt1, pt2):
    lat1 = math.radians(pt1['lat'])
    lat2 = math.radians(pt2['lat'])

    delta_lon = math.radians(pt2['long'] - pt1['long'])
    y = math.sin(delta_lon) * math.cos(lat2)
    x = (math.cos(lat1) * math.sin(lat2) -
         (math.sin(lat1) * math.cos(lat2) * math.cos(delta_lon)))

    bearing_r = math.atan2(y, x)
    return (math.degrees(bearing_r) + 360) % 360



def segment_to_json(segment):
    json_seg = [point_to_dict(pt) for pt in segment]
    for i in range(0, len(json_seg) - 1):
        pt1 = json_seg[i]
        pt2 = json_seg[i + 1]
        bearing = calculate_bearing(pt1, pt2)
        print("bearing: {}".format(bearing))
        pt1['bear'] = bearing
    return json_seg


def blob_to_dict(blob):
    """Convert GPX to dict"""
    try:
        root = ET.fromstring(blob)
    except ET.ParseError as e:
        raise TypeError("Not a GPX file (xml parsing failed: {})".format(e))

    if (root.tag != TAG_GPX):
        raise TypeError("Not a GPX file (xml parsing passed)")

    segments = root.findall("./" + NS + "trk/" + NS + "trkseg")

    dicts = [segment_to_json(s) for s in segments]

    return {
        'segments': dicts
    }


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: {} <gpxfile>".format(sys.argv[0]))
        sys.exit(1)
    with open(sys.argv[1]) as f:
        blob = f.read()

    blob_to_dict(blob)
