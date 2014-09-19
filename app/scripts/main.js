$.get('test/data/LAML.json', function(data) {
    "use strict";
    var graph = new Graph(data.nodes, data.edges);
    var collapsed = graph.collapse(-0.1);
    var collapsed = collapsed.extractNeighbourhood("114130", 5); // graph.collapse(.6);
    console.log(collapsed);

    var graph_div = $('#graph')[0];
    console.log(graph_div);
    var width = 1200;
    var height = 1200;

    var color = d3.scale.category20();

    var force = d3.layout.force()
        .charge(-200)
        .linkDistance(30)
        .size([width, height]);

    var svg = d3.select(graph_div).append("svg")
        .attr("width", width)
        .attr("height", height);

    force
        .nodes(collapsed.nodes)
        .links(collapsed.edges)
        .start();

    var link = svg.selectAll(".link")
        .data(collapsed.edges)
      .enter()
        .append("line")
        .attr("class", "edge")
        .style("stroke", "#aaa")
        .style("stroke-width", 1.0);

    var node = svg.selectAll(".node")
        .data(collapsed.nodes, function (d) { return d.name; })
      .enter()
        .append("circle")
        .attr("class", "node")
        .attr("r", function(d) { return 5.0 + Math.sqrt(d.ids === undefined ? 0.0 : d.ids.length / 20.0); })
        .style("fill", function(d,i) { return color(i); })
        .style("stroke", "#000")
        .style("stroke-width", .5)
        .call(force.drag);
    node.append('title')
        .text(function(d) { return d.ids === undefined ? '[id ' + d.name + ']' : '[' + d.ids.length + ' collapsed nodes]'; })

    force.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    });
});