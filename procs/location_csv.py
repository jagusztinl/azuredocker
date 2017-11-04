#!/usr/bin/env python

def line_to_dict(line):
    p = line.split(",");
    return {
        "ts": int(p[0]),
        "lat": float(p[1]),
        "long": float(p[2]),
        "acc": float(p[3]),
        "bear": float(p[4]),
        "speed": float(p[5])
    }


def blob_to_dict(blob):
    # Could be optimized by handling streams
    lines = blob.splitlines()
    ret = []
    for idx, line in enumerate(lines):
        ret.append(line_to_dict(line))
    return ret


def csv_to_dict(path):
    with open(path) as f:
        return [line_to_dict(l) for l in f.readlines()]