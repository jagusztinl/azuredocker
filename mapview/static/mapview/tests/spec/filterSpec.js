describe("CB.filter", function() {
  var location;

  beforeEach(function() {
    location = [].concat(TEST_ENTRY.location);
  });
  

  it("stops should not overlap", function() {
    var stops = CB.QualityModel.findStops(location), i;
    for(i=0;i<stops.length-1;i++) {
        expect(stops[i][1].ts).not.toBe(stops[i+1][0].ts);
    }
  });
});
