
CB.GraphView = Backbone.View.extend({
    tagName: "div",
    eventAggregator: null,
    template: _.template('<h1><%= id %><h1>'),
    
    initialize: function(options) {
        options = options || {};
        if (options.eventAggregator) {
            this.eventAggregator = options.eventAggregator;
            this.eventAggregator.bind('select', this.setModel, this);
            this.eventAggregator.bind('selectpoint', this.selectPoint, this);
//            this.eventAggregator.bind('pointmouseover', this.mouseOver, this);
//            this.eventAggregator.bind('pointmouseout', this.mouseOut, this);
        }
    },
    
    initSVG: function() {
        var margin = {top: 20, right: 20, bottom: 30, left: 50},
            width = this.$el.width() - margin.left - margin.right,
            height = this.$el.height() - margin.top - margin.bottom, svg, pathContainer;
        svg = d3.select(this.el).append("svg");
        pathContainer = svg.attr("width", width + margin.left + margin.right)
           .attr("height", height + margin.top + margin.bottom)
           .append("g")
           .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        

        var x = d3.time.scale()
            .range([0, width]);
        var y = d3.scale.linear()
            .range([height, 0]);
            
        var line = d3.svg.line()
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y(d.kmh); });
            
        this.scaleX = x;
        this.scaleY = y;
        this.svg = svg;
        
        this.pathContainer = pathContainer;
        this.line = line;
        
        var marker = pathContainer.append("circle")
            .attr('r', 7)
//            .style('display', 'none')
            .style('fill', '#FFFFFF')
            .style('pointer-events', 'none')
            .style('stroke', '#FB5050')
            .style('stroke-width', '3px');
        this.marker = marker;
    },
    
    render: function() {
        if (!this.svg) {
            this.initSVG();
        }
        var location = [];
        if (this.model) {
            location = this.model.toJSON().location;
        }
        
        if (location) {
            this.renderGraph(location);
        }
    },
    
    renderGraph: function(location) {
        var data = location;
        data.forEach(function(d) {
          d.date = new Date(d.ts);
          d.kmh = d.speed * 3.6; // m/s to km/h
        });
      
        this.scaleX.domain(d3.extent(data, function(d) { return d.date; }));
        this.scaleY.domain(d3.extent(data, function(d) { return d.kmh; }));
        
        this.pathContainer.selectAll("path").remove(); // remove all
        this.pathContainer.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("d", this.line);
        this._lastData = location;
    },
    
    setModel: function(model) {
        this.stopListening();
        this.model = model;
        this.listenTo(model, 'add', this.addOne);
        this.listenTo(model, 'destroy', this.onDestroyModel);
        this.listenTo(model, 'sync', this.render);
        this.render();
    },
    
    selectPoint: function(point) {
        this.marker.attr("cx", this.scaleX(point.date));
        this.marker.attr("cy", this.scaleY(point.kmh));
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
    
    findByLatLng: function(latLng) {
        function c(l) {
            return Math.round(l * 10000);
        }
        var lat = c(latLng[0]), lng = c(latLng[1]), location = this._lastData, i, point;
        for(i=0;i<location.length;i++) {
            point = location[i];
            var clat = c(point.lat);
            var clong = c(point.long);
            if (clat === lat && clong === lng) {
                return point;
            }
        }
    },
    
    mouseOut: function(model, index) {
        if (model && model.id === this.model.id) {
        }
    },
    
    onDestroyModel: function(model) {
        this.stopListening();
        this.model = null;
        this.render();
    }
});