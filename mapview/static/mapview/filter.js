(function () {
/*global CB, Backbone, _, alert, console, moment */
"use strict";

CB.namespace("filter");

function getAverageSpeed(location) {
    var duration_ms = location[location.length-1].ts - location[0].ts;
    var total = 0;
    var i, l;
    for(i=0;i<location.length-1;i++) {
        l=location[i];
        total += (l.speed * (location[i+1].ts - l.ts));
    }
    
    return total / duration_ms;
}

function getDuration(location) {
    return location[location.length-1].ts - location[0].ts;
}

function getDistanceInKm(location) {
    return (getAverageSpeed(location) * 3.6) * (getDuration(location) / 60 / 60 / 1000);
}






CB.filter.dateFromLocation = function(location) {
    var m = moment(location[0].ts);
    m = moment(location[0].ts);
    return m.format("YYYY-MM-DD HH:mm:ss");
};

CB.filter.durationFromLocation = function(location) {
    return location[location.length-1].ts - location[0].ts;
};

CB.filter.msToMin = function(ms) {
    return Math.round(ms / 1000 / 60);
};




CB.filter.sumStopTime = function(stops) {
    return _.reduce(stops, function(memo, stop) {
        return memo + stop[1].ts - stop[0].ts;
    }, 0);
};

CB.filter.getDistanceInKm = getDistanceInKm;

CB.filter.getAverageSpeed = getAverageSpeed;

}());