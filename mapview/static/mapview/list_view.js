/*global Backbone, _, d3, CB, moment*/
(function() {
"use strict";

CB.BRQItemView = Backbone.View.extend({
    tagName: "li",
    selectedClass: "selected",
//    template: _.template('<%= CB.filter.dateFromLocation(location) %> - <%= CB.filter.msToMin(CB.filter.durationFromLocation(location)) %> min, <%= Math.round(CB.filter.sumStopTime(stops)/1000) %> s'),
    template: _.template('<%= id %>'),
    
    events: {
        "click": "onClick"
    },

    initialize: function(options) {
        this._selected = false;
        options = options || {};
        if (options.eventAggregator) {
            this.eventAggregator = options.eventAggregator;
            this.eventAggregator.bind('select', this.onSelect, this);
        }
        if (options.selectedClass) {
            this.selectedClass = options.selectedClass;
        }
    },
    
    onSelect: function(model) {
        var before = this._selected;
        
        if (model && this.model === model) {
            this._selected = true;
        } else {
            this._selected = false;
        }
        
        if (Boolean(before) != Boolean(this._selected)) {
            this.render();
        }
    },
    

    render: function() {
        if (this._selected) {
            this.$el.addClass(this.selectedClass);
        } else {
            this.$el.removeClass(this.selectedClass);
        }
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },
    
    onClick: function() {
        if (this.eventAggregator) {
            this.eventAggregator.trigger("select", this.model);
        }
    }
});



CB.DataListView = Backbone.View.extend({
    tagName: "ul",
    eventAggregator: null,

    initialize: function(options) {
        options = options || {};
        if (options.eventAggregator) {
            this.eventAggregator = options.eventAggregator;
        }
        if (options.selectedClass) {
            this.selectedClass = options;
        }
        this._subviews = {};
        this.listenTo(this.collection, 'add', this.addOne);
        this.listenTo(this.collection, 'reset', this.addAll);
//        this.listenTo(this.collection, 'all', this.render);
        this.listenTo(this.collection, 'remove', this.removeOne);
        
        this.collection.fetch();
    },
    
    addAll: function() {
        this.collection.each(this.addOne, this);
    },

    addOne: function(item) {
        var view = new CB.BRQItemView({
            model: item,
            eventAggregator: this.eventAggregator,
            selectedClass: this.selectedClass
        });
        this._subviews[item.id] = view;
        this.$el.append(view.render().el);
    },
    
    removeOne: function(item) {
        this._subviews[item.id].remove();
        delete this._subviews[item.id];
        this.stopListening(item);
    }
});
}());