#!/usr/bin/env python3

from . import location_csv
from . import gpx_parser  # noqa
import logging


def try_parse(blob, filename=None):
    """Try the parsers, let the filename inform which one to try first"""
    ret = None

    for parser in [location_csv.blob_to_dict, gpx_parser.blob_to_dict]:
        try:
            ret = parser(blob)
            if ret:
                logging.debug(
                    "try_pares -> Got return for: {}, returning!".format(
                        parser.__doc__))
                return ret
        except TypeError as e:
            logging.debug("Failed parsing with parser: {} -> {}".format(
                parser.__doc__, e))

    return None
