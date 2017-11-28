
CB.StopView = Backbone.View.extend({
    tagName: "div",
    eventAggregator: null,
    template: _.template('<h1><%= id %><h1>'),
    height: 20,
    
    initialize: function(options) {
        options = options || {};
        if (options.eventAggregator) {
            this.eventAggregator = options.eventAggregator;
            this.eventAggregator.bind('select', this.setModel, this);
        }
        if (options.height) {
            this.height = options.height;
        }
    },
    
    initSVG: function() {
        var margin = {top: 5, right: 20, bottom: 5, left: 50},
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
            
        this.scaleX = x;
        this.scaleY = y;
        this.svg = svg;
        
        this.pathContainer = pathContainer;
        
    },
    
    render: function() {
        if (!this.svg) {
            this.initSVG();
        }
        var location = [], stops = [];
        if (this.model) {
            location = this.model.toJSON().location || [];
            stops = this.model.toJSON().stops || [];
        }
        
        this.renderGraph(location, stops);
    },
    
    renderGraph: function(location, stops) {
        var HEIGHT = 20;
        location.forEach(function(d) {
          d.date = new Date(d.ts);
          d.kmh = d.speed * 3.6; // m/s to km/h
        });
        stops.forEach(function(s) {
          s.date = new Date(s.ts);
        });
      
        this.scaleX.domain(d3.extent(location, function(d) { return d.date; }));
        this.scaleY.domain(d3.extent(location, function(d) { return d.kmh; }));
        
//        this.pathContainer.selectAll("*").remove(); // remove all
        
        if (location.length > 0) {
            this.pathContainer.append("line")
                .attr("class", "stop")
                .attr("x1", this.scaleX(location[0].date))
                .attr("x2", this.scaleX(_(location).last().date))
                .attr("y1", HEIGHT * 0.5)
                .attr("y2", HEIGHT * 0.5);
        }
            
        this.pathContainer.select("rect").data(stops).enter().append("rect")
                .attr("class", "stop")
                .attr("x", function(stop) { return this.scaleX(stop[0].date); }.bind(this))
                .attr("y", 0)//(this.scaleY.range()[0] * 0.5) - (HEIGHT * 0.5))
                .attr("width", function(stop) { return this.scaleX(stop[1].date) - this.scaleX(stop[0].date); }.bind(this))
                .attr("height", HEIGHT);

    },
    
    setModel: function(model) {
        this.stopListening();
        this.model = model;
        this.listenTo(model, 'add', this.addOne);
        this.listenTo(model, 'destroy', this.onDestroyModel);
        this.listenTo(model, 'sync', this.render);
        this.render();
    },

    onDestroyModel: function(model) {
        this.stopListening();
        this.model = null;
        this.render();
    }
});