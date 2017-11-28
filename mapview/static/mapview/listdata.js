/*global Backbone, _, d3, CB*/

$(document).ready(function() {
    new CB.DataListView({
        el: $("#list_container"),
        detailedView: new CB.GraphView({el: $("#detailed_view")}),
        collection: new CB.QualityCollection()
    });
});
