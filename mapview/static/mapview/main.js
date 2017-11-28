
$ctx = {};
$qualityProvider = null;

function latLngFromItem(item) {
    return new google.maps.LatLng(item.lat, item.long);
}

var __curMarker = null;
function showCurrentPos(map, item) {
    var options;
    var pos = latLngFromItem(item);
    
    if (__curMarker) {
        __curMarker.setMap(null);
    } 
    if (true) {
        options = {
                map: map,
                position: pos,
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 3,
                    strokeColor: '#008',
                    strokeOpacity: 1,
                    strokeWeight: 0.5,
                    fillColor: '#88f',
                    fillOpacity: 1,
                    rotation: item.bear
                }
        };    
        __curMarker = new google.maps.Marker(options);
//        __curMarker = new google.maps.Circle(options);
    } 
}

var circles = [];

var lastColor = 0;
function showCircle(map, item) {
    if (item.acc > 10) {
        
        return;
    }
//    lastColor = (lastColor + 1) % 0xfff;
//   var color = '#' + lastColor.toString(16);
    var color = '#000';
    var opacity = 0.35;//(100 - Math.min(95, item.acc)) / 100;
    var center = latLngFromItem(item);
    var delta = item.ts - $ctx.firstTs;
    var quality = $qualityProvider.getQualityByDelta(delta / 1000);
    // Quality is 0 - 10
    if (quality < 0) {
        return;
    }
    color = "rgb(" + Math.ceil(25.5 * quality) + ", 64, 64)";
    opacity = Math.min(10, quality) / 10;
    console.log("Quality " + quality);
    var populationOptions = {
        strokeColor: '#888',//'#4444FF',
        strokeOpacity: 5,
        strokeWeight: 1,
        fillColor: color, //'#8888FF',
        fillOpacity: opacity,
        map: map,
        center: center,
        radius: item.acc
  };
  var circle = new google.maps.Circle(populationOptions);    
  circles.push(circle);
  /*
  if (circles.length > 30) {
      var oldCircle = circles.splice(0,1)[0];
      oldCircle.setMap(null);
  }
  */
}

$mapProvider = {
    getMap: function(center) {
        var mapOptions;
        if (!$mapProvider._map) {
            mapOptions = {
                zoom: 15,
//                center: center,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            $mapProvider._map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
        }
        return $mapProvider._map;
    }
};


CB.AppView = Backbone.View.extend({
    _propNames: ["map", "eventAggregator"],
    tagName: "div",
    eventAggregator: null,
    map: null,

    initialize: function(options) {
        options = options || {};
        _(this._propNames).each(function(propName) {
            if (options.hasOwnProperty(propName)) {
                this[propName] = options[propName];
            }
        }, this);
        this._subviews = {};
        this.listenTo(this.collection, 'add', this.addOne);
        this.listenTo(this.collection, 'reset', this.addAll);
        this.listenTo(this.collection, 'remove', this.removeOne);
        this.collection.fetch();
    },
    
    addAll: function() {
        this.collection.each(this.addOne, this);
    },

    addOne: function(item) {
        var view = new CB.MapView({
            map: this.map,
            model: item,
            eventAggregator: this.eventAggregator
        });
        this._subviews[item.id] = view;
        view.render();
      //this.listenTo(item, "select", this.onItemSelect);
    },
    
    removeOne: function(item) {
        this._subviews[item.id].remove();
        delete this._subviews[item.id];
        this.stopListening(item);
    }
});


function main() {
    var eventAggregator = _.extend({}, Backbone.Events);
    
    var collection = new CB.QualityCollection();
    var dataListView = new CB.DataListView({
        eventAggregator: eventAggregator,
        collection: collection,
//        el: $("#list_container"),
        attributes: {
            "class": "dataList"
        }
    });
    $("#list_container").append(dataListView.el);
    
    var graphView = new CB.GraphView({
        el: $("#graph_view"),
        eventAggregator: eventAggregator
    });
    
    var stopView = new CB.StopView({
        el: $("#stop_view"),
        eventAggregator: eventAggregator
    });
    
    
    var detailView = new CB.DetailView({
        el: $("#detail_view"),
        eventAggregator: eventAggregator
    });
    
    
    var appView = new CB.AppView({
        eventAggregator: eventAggregator,
        collection: collection,
        map: $mapProvider.getMap()
    });
    
}

google.maps.event.addDomListener(window, 'load', main);