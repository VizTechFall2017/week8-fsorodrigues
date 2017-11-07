var width = document.getElementById('svg').clientWidth;
var height = document.getElementById('svg').clientHeight;

console.log(width);
console.log(height);

var marginLeft = 0;
var marginTop = 0;

var svg = d3.select('#svg')
             .append('g')
             .attr('transform', 'translate(' + marginLeft + ',' + marginTop + ')');

var tooltip = d3.select(".tooltip-container")
                .append("html")
                .attr("class", "tooltip")
                // .style("opacity", 0)
                .html("Hover over the map to find out");

var formatComma = d3.format(",");

//set up the projection for the map
var albersProjection = d3.geoAlbersUsa()  //tell it which projection to use
                          .scale(1100)    //tell it how big the map should be
                          .translate([(width/2), (height/2)]);  //set the center of the map to show up in the center of the screen


path = d3.geoPath()                        //set up the path generator function to draw the map outlines
          .projection(albersProjection);   //tell it to use the projection that we just made to convert lat/long to pixels

var stateLookup = d3.map();

var originLookup = d3.map();

var colorScale = d3.scaleLinear().range([d3.rgb("#f0f8ff"), d3.rgb("#3399cc")]);

// length = 100,
//     color = d3.scale.linear().domain([1,length])
//       .interpolate(d3.interpolateHcl)

queue()
    .defer(d3.json, "./cb_2016_us_state_20m.json")
    .defer(d3.csv, "./undocumented_state_estimates.csv")
    .await(function(err, mapData, undocumented){

    undocumented.forEach(function(d){
                  stateLookup.set(d.state, d.estimate);
                  originLookup.set(d.state, d.origin);
    });

    colorScale.domain([d3.min(undocumented.map(function(d){return +d.estimate})), d3.max(undocumented.map(function(d){return +d.estimate}))]);

    svg.selectAll("path")               //make empty selection
        .data(mapData.features)          //bind to the features array in the map data
        .enter()
        .append("path")                 //add the paths to the DOM
        .attr("d", path)                //actually draw them
        .attr("class", "feature")
        .attr("id", function(d) {return d.properties.STUSPS })
        .attr('fill', function(d){
            return colorScale(stateLookup.get(d.properties.STUSPS))})
        .attr("opacity", .8)
        .attr('stroke','grey')
        .attr('stroke-width', .1)
        .on("mouseover", function(d) {
          d3.select(this)
              .attr('stroke', "black")
              .attr('stroke-width', .8)
              .attr("fill", "#194c66");

          if (originLookup.get(d.properties.STUSPS) == "N/A") {
            d3.select(".tooltip")
                .style("opacity", 1)
                .html("<span>Sample size in</span> <b> " + d.properties.NAME + "</b> <span>is too small to produce reliable estimate.</span>" );

          } else {
            d3.select(".tooltip")
                .style("opacity", 1)
                .html("<span>In</span> <b>" + d.properties.NAME + "</b><span>, the largest undocumented community is from</span> <b>" + originLookup.get(d.properties.STUSPS) + "</b>.");
          }

        })
        .on("mouseout", function(d) {
          d3.select(this)
              .attr('stroke', "grey")
              .attr('stroke-width', .1)
              .attr("fill", function(d){
                  return colorScale(stateLookup.get(d.properties.STUSPS))
                })
          })

    svg.append("text")
        .attr("class", "text")
        .text("Source: Pew Research Center")
        .attr("x", width-300)
        .attr("y", height-10)

});
