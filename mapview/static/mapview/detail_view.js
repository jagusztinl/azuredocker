(function () {
/*global CB, Backbone, _, alert, console */
"use strict";

CB.DetailView = Backbone.View.extend({
    tagName: "div",
    eventAggregator: null,
    template: _.template('<h1><%= id %></h1>' +
                         '<p>Duration: <%= Math.round(duration / 1000 / 60) %>min<p>' +
                         '<p>Average Speed: <%= (avg_speed * 3.6).toFixed(1) %>km/h<p>' +
                         '<p>Distance : <%= (distance_km).toFixed(1) %>km<p>' +
                         '<p>Stops : <%= stops.length %><p>' +
                         ''),
    
    initialize: function(options) {
        options = options || {};
        if (options.eventAggregator) {
            this.eventAggregator = options.eventAggregator;
            this.eventAggregator.bind('select', this.setModel, this);
//            this.eventAggregator.bind('pointmouseover', this.mouseOver, this);
//            this.eventAggregator.bind('pointmouseout', this.mouseOut, this);
        }
    },
    
    render: function() {
        try {
            this._render();
        } catch(e) {
            alert("Error " + e);
            console.log("Error: " + e);
        }
    },
    
    _render: function() {
        var model = this.model.toJSON();
        var location = model.location;
        var duration = CB.filter.durationFromLocation(location);
        
        
        var data = {
            id: this.model.id,
            duration: duration,
            avg_speed: CB.filter.getAverageSpeed(location),
            distance_km: CB.filter.getDistanceInKm(location),
            stops: model.stops
        };
        this.$el.html(this.template(data));
    },

    
    setModel: function(model) {
        this.stopListening();
        this.model = model;
        this.listenTo(model, 'add', this.addOne);
        this.listenTo(model, 'destroy', this.onDestroyModel);
        this.render();
    },
    
    mouseOver: function(model, latLng) {
        var point;
        if (model && model.id === this.model.id) {
            point = this.findByLatLng(latLng);
            if (!point) {
                return;
            }
            this.marker.attr("cx", this.scaleX(point.date));
            this.marker.attr("cy", this.scaleY(point.kmh));
        }
        
    },
    
    onDestroyModel: function(model) {
        this.stopListening();
        this.model = null;
        this.render();
    }
});
}());
