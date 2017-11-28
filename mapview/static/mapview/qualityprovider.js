(function () {
/*global CB, _, Backbone, console */
"use strict";

function removeStopsAtDestination(stops, location) {
    var DISTANCE_THRESHOLD_KM = 20 / 1000;
    var ret = [], destination = _(location).last();
    _(stops).each(function(stop) {
        var distance = getDistance(stop[0], destination);
        if (distance  > DISTANCE_THRESHOLD_KM) {
            ret.push(stop);
        }
    });
    
    return ret;
}

function getDistance(pos1, pos2) {
  var keyLong = "long", lat1 = pos1.lat, lon1 = pos1[keyLong],
    lat2 = pos2.lat, lon2 = pos2[keyLong];
  
  var R = 6371; // Radius of the earth in km
  var dLat = (lat2 - lat1) * Math.PI / 180;  // deg2rad below
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = 
     0.5 - Math.cos(dLat)/2 + 
     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
     (1 - Math.cos(dLon))/2;

  return R * 2 * Math.asin(Math.sqrt(a));
}

function findStops(location) {
    var SPEED_THRESHOLD = 0.2;
    var stops = [], stop;
    var i=0;
    
    function nextMove(location, i) {
        i++;
        while(i<location.length) {
            if (location[i].speed > SPEED_THRESHOLD && (location[i+1] || {}).speed > SPEED_THRESHOLD) {
                return i;
            } else {
                i++;
            }
        }
    }
    
    while(i<location.length) {
        if (location[i].speed > SPEED_THRESHOLD || (location[i+1] || {}).speed > SPEED_THRESHOLD) {
            i++;
            continue;
        }
        stop = [location[i]];
        i = nextMove(location, i);
        stop.push(location[i]);
        stops.push(stop);
    }
    
    stops = removeStopsAtDestination(stops, location);
    
    return stops;
}



    
CB.QualityModel = Backbone.Model.extend({
    urlRoot: "/parsed/",

    isValidData: function(data) {
        return (data && data.entries_per_second && data.quality);
    },

    parse: function(response, options) {
        this.trimLocation(response.location);
        response.stops = findStops(response.location);
        return response;
    },
    
    trimLocation: function(location) {
        var MIN_SPEED = 0.5, MIN_MS_FREQ = 2100, start, end;
        
        function findStart(l) {
            var i = 0, ts_delta = Infinity;
            while(i < l.length) {
                if (i > 0) {
                    ts_delta = l[i].ts - l[i-1].ts;
                }
                if (l[i].speed >= MIN_SPEED &&
                    (l[i+1] || {}).speed >= MIN_SPEED &&
                    (l[i+2] || {}).speed >= MIN_SPEED &&
                    (l[i+3] || {}).speed >= MIN_SPEED &&
                    (l[i+4] || {}).speed >= MIN_SPEED &&
                    ts_delta < MIN_MS_FREQ) {
                    return i;
                }
                i++;
            }
            return -1;
        }
        
        function findEnd(l) {
            var i = l.length-1;
            while(i > 0) {
                if (l[i].speed >= MIN_SPEED) {
                    return i;
                }
                i--;
            }
            return -1;
        }
        

        start = findStart(location);
        end = findEnd(location);
        console.log(CB.fmt("Trimming [{}:{}]", start, end));
        if (end > -1) {
            location.splice(end);
        }
        if (start > -1) {
            location.splice(0, start);
        }
    }
}, {
    findStops: findStops
});

}());


CB.QualityCollection = Backbone.Collection.extend({
    url: "/parsed/",
    model: CB.QualityModel,
    parse: function(response) {
        return _(response).filter(function(o) {
            return o.location.length > 5;
        });
    }
});