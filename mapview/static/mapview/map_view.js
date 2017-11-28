(function () {
/*global Backbone, _, CB, console, google */
"use strict";
var getLocationQualityTuples = (function() {
    function getFirstTs(data) {
        return data.start_ts * 1000;
    }          
    
    function getQualityByDelta(data, msDelta) {
        var secondsDelta = msDelta / 1000;
        var index = Math.ceil(secondsDelta * data.entries_per_second);
        return data.quality[index];
    }
    
    return function (data) {
        var speed_threshold = 0.6;
        var location = data.location,
            firstTs = getFirstTs(data),
            ret = [], i, delta, quality,
            item;
        
        for(i=0;i<location.length;i++) {
            item = location[i];
            if (item.speed < speed_threshold) {
                continue;
            }
            delta = item.ts - firstTs;
            quality = getQualityByDelta(data, delta);
            quality = quality * quality / 5;
            ret.push([item, quality]);
        }
        console.log("Number of points: " + ret.length);
        return ret;
    };
}());


CB.MapView = Backbone.View.extend({
    map: null,
    eventAggregator: null,

    initialize: function(options) {
        options = options || {};
        this.map = options.map;
        if (options.eventAggregator) {
            this.eventAggregator = options.eventAggregator;
            this.eventAggregator.bind('select', this.onSelect, this);
        }
        this._lines = [];
        this._selected = false;
        this._tuples = false;
        return Backbone.View.prototype.initialize.apply(arguments);
    },
   
    getTuples: function() {
        var tuples;
        if (this._tuples) {
            tuples = this._tuples;
        } else {
            tuples = getLocationQualityTuples(this.model.attributes);
            this._tuples = null;
        }
        return tuples;
    },
    
    render: function() {
        var i, map, tuples = this.getTuples(), line;
        map = this.map;
        
        if (!this._marker) {
            this.createMarker();
        }
        
        if (!this._startMarker) {
            this.createStartMarker();
        }
        
        if (!this._endMarker) {
            this.createEndMarker();
        }
        
        if (!tuples || tuples.length === 0) {
            return;
        }
        this.map.setCenter(this.latLngFromItem(tuples[0][0]));
        
        for(i=0;i<tuples.length-1;i++) {
            line = this.showLine(map, tuples[i][0], tuples[i+1][0], tuples[i][1]);
        }
        if (this._selected) {
            this.showMarkers();
        } else {
            this.hideMarkers();
        }
    },
    
    latLngFromItem: function(item) {
        return new google.maps.LatLng(item.lat, item.long);
    },
    
    showLine: function(map, itemStart, itemEnd, quality) {
        var color = '#000';
        var opacity = 1;//0.35;//(100 - Math.min(95, item.acc)) / 100;
        var path = [this.latLngFromItem(itemStart), this.latLngFromItem(itemEnd)];
        // Quality is 0 - 10
        if (quality < 0) {
            return;
        }
        var c;
        if (false) {
        c = 200 - Math.ceil(20 * quality);
        color = "rgb(" + c + "," + c + "," + c + ")";
        } else {
            c = Math.ceil(22.5 * quality);
            color = "rgb(" + c + "," + (255 - c) + "," + 0 + ")";
            
        }
        var weight = Math.max(quality / 2, 1);
        var bikePath = new google.maps.Polyline({
           path: path,
           geodesic: true,
           strokeColor: color,
           clickable: false,
           strokeOpacity: opacity,
           strokeWeight: weight
        });
        bikePath.setMap(map);
        this._lines.push(bikePath);
        return bikePath;
    },
    
    onPathClicked: function() {
        if (this.eventAggregator && !this._selected) {
            this.eventAggregator.trigger('select', this.model, {noPan: true});
        }
    },
    
    onMouseOver: function(event) {
        if (this.eventAggregator && this._selected) {
            this.eventAggregator.trigger('pointmouseover', this.model, [event.latLng.lat(), event.latLng.lng()]);
        }
    },
    
    onMouseOut: function(line) {
        if (this.eventAggregator) {
            this.eventAggregator.trigger('pointmouseout', this.model);
        }
    },
    
    
    
    clearLines: function() {
        _(this._lines).each(function(line) {
            google.maps.event.clearInstanceListeners(line);
            line.setMap(null);
        });
        this._lines.splice(0);
    },
    
    createStopMarkers: function() {
        var me = this,
            stops = this.model.attributes.stops,
            markers = [];
        _(stops).each(function(stop) {
            markers.push(me._createStopMarker(stop));
        });
        this._stopMarkers = markers;
    },
    
    _createStopMarker: function(locationTuple) {
        var me = this,
            marker = new google.maps.Marker({
            position: this.latLngFromItem(locationTuple[0]),
            icon: {
                url: "images/hourglass.png"
            },
            map: this.map,
            title: CB.fmt("{} seconds (from start: {})\r\n{}", Math.round((locationTuple[1].ts - locationTuple[0].ts) / 1000), Math.round((locationTuple[0].ts - me.model.attributes.location[0].ts) / 1000) , me.getDebugInfo(locationTuple)),
            visible: false
        });
        google.maps.event.addListener(marker, 'click', function() {
            if (me.eventAggregator && me._selected) {
                me.eventAggregator.trigger('selectpoint', locationTuple[0]);
            }            
        });
        return marker;
    },
    
    getDebugInfo: function(locationTuple) {
        var me = this,
            location = me.model.attributes.location,
            start = -1, end = -1, i, ret;
        _(location).each(function(pos, i) {
            if (pos.ts === locationTuple[0].ts) {
                start = i;
            }
            if (pos.ts === locationTuple[1].ts) {
                end = i;
            }
        });
        ret = [];
        if (start > -1 && end > -1) {
            for(i=start;i<=end;i++) {
                ret.push(CB.fmt("[{ts}] speed: {speed}, lat: {lat}, long: {long}", location[i]));
            }
        }
        return ret.join("\r\n");
    },
    
    createStartMarker: function() {
        this._startMarker = new google.maps.Marker({
            position: this.latLngFromItem(this.model.attributes.location[0]),
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10
            },
            map: this.map,
            title: 'Start',
            visible: false
        });        
    },
    
    createEndMarker: function() {
        this._endMarker = new google.maps.Marker({
            position: this.latLngFromItem(_(this.model.attributes.location).last()),
            map: this.map,
            title: 'End',
            visible: false
        });        
    },
    
    
    createMarker: function() {
        var tuples = this.getTuples(), map = this.map, path = [], i;
        if (this._marker) {
            // Destroy
            google.maps.event.clearInstanceListeners(this._marker);
            this._marker.setMap(null);
        }
        
        for(i=0;i<tuples.length;i++) {
            path.push(this.latLngFromItem(tuples[i][0]));
        }
        
        var marker = new google.maps.Polyline({
           path: path,
           geodesic: true,
           strokeColor: "#FFFF00",
           strokeOpacity: 0,
           strokeWeight: 10,
           zIndex: -1000
        });
        marker.setMap(map);
        google.maps.event.addListener(marker, 'mouseover', this.onMouseOver.bind(this));
        google.maps.event.addListener(marker, 'click', this.onPathClicked.bind(this));
        this._marker = marker;
    },
    
    destroyMarkers: function() {
        var me = this;
        _(["_marker", "_startMarker", "_endMarker"]).each(function(key) {
            var marker;
            if (me[key]) {
                marker = me[key];
                google.maps.event.clearInstanceListeners(marker);
                marker.setMap(null);
                me[key] = null;
            }
        });
        _(this._stopMarkers || []).each(function(marker) {
            google.maps.event.clearInstanceListeners(marker);
            marker.setMap(null);
        });
        this._stopMarkers = null;
    },
    
    showMarkers: function() {
        if (this._marker) {
            this._marker.setOptions({
                strokeOpacity: 1
            });
        }
        
        if (!this._stopMarkers) {
            this.createStopMarkers();
        }
        function showMarker(marker) {
            if (marker) {
                marker.setOptions({visible: true});
            }
        }
        showMarker(this._startMarker);
        showMarker(this._endMarker);
        _(this._stopMarkers || []).each(showMarker);
    },
    
    hideMarkers: function() {
        if (this._marker) {
            this._marker.setOptions({
                strokeOpacity: 0
            });
        }
        function hideMarker(marker) {
            if (marker) {
                marker.setOptions({visible: false});
            }
        }
        hideMarker(this._startMarker);
        hideMarker(this._endMarker);
        _(this._stopMarkers || []).each(hideMarker);
    },
    
    
    panToView: function() {
        if (!this._marker) {
            throw "No marker, call createMarker() first!";
        }
        var path = this._marker.getPath(),
            bounds = new google.maps.LatLngBounds(path[0], path[0]);
        path.forEach(function(point) {
           bounds.extend(point); 
        });
        this.map.panTo(bounds.getCenter());
    },
    
    onSelect: function(model, options) {
        options = options || {};
        if (model && model.id === this.model.id) {
            if (this._selected) {
                return;
            }
            this._selected = true;
        } else {
            if (!this._selected) {
                return;
            }
            this._selected = false;
        }
        if (this._selected) {
            this.showMarkers();
            if (!options.noPan) {
                this.panToView();
            }
        } else {
            this.hideMarkers();
        }
    },
    
    cleanup: function() {
        this.destroyMarkers();
        this.clearLines();
        this.stopListening();
    }
});

}());
