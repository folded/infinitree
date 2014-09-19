var Graph = function(nodes, edges) {
	this.nodes = nodes;
	this.edges = edges;
	this.makeAdjacency();
	this.makeNodeIdxMap();
};

Graph.prototype.findNode = function(name) {
	console.log(name, this.name_to_idx[name])
	return this.name_to_idx[name];
};

Graph.prototype.findMappedNode = function(name) {
	if (this.name_map !== undefined) {
		return this.findNode(this.name_map[name]);
	} else {
		return this.findNode(name);
	}
};

Graph.prototype.neighbourhoodIds = function(name, radius) {
	var self = this;

	var start_idx = this.findNode(name);
	if (start_idx === undefined) {
		return [];
	}

	var open = [ {idx: start_idx, dist: 0} ];
	var heap = new Heap(function(a, b) { return a.dist < b.dist; })
	var closed = {};
	while (open.length) {
		heap.pop(open, open.length);
		var n = open.pop();
		if (closed[n.idx]) continue;

		closed[n.idx] = true;
		if (n.dist < radius) {
			_.each(this.adj[n.idx], function(v, k) {
				if (!closed[k]) {
					heap.push(open, open.length, { idx: k, dist: n.dist + 1 })
				}
			});
		}
	}
	return _.map(closed, function(v, k) { return self.nodes[k].name; });
};

Graph.prototype.extractNeighbourhood = function(name, radius) {
	var self = this;
	var keys = this.neighbourhoodIds(name, radius);
	var keydict = {};
	var out_nodes = [];
	var out_edges = [];
	var n = 0;
	_.each(keys, function(v) {
		keydict[v] = n++;
	});

	_.each(this.nodes, function(v, i) {
		if (keydict[v.name] !== undefined) {
			out_nodes[keydict[v.name]] = _.extend({}, v);
		}
	});

	_.each(this.edges, function(v, i) {
		var s = keydict[self.nodes[v.source].name];
		var t = keydict[self.nodes[v.target].name];
		if (s !== undefined && t !== undefined) {
			out_edges.push(_.extend({}, v, { source: s, target: t}));
		}
	});
	var out = new Graph(out_nodes, out_edges);
	if (this.name_map) {
		out.name_map = {};
		_.each(this.name_map, function(v, k) {
			if (keydict[v] !== undefined) {
				out.name_map[k] = v;
			}
		});
	}
	return out;
};

Graph.prototype.makeAdjacency = function() {
	this.adj = {};
	for (var i = 0; i < this.edges.length; ++i) {
		var e = this.edges[i];
		if (e.source === undefined || e.target === undefined) console.log('undefined', e);
		if (this.adj[e.source] === undefined) this.adj[e.source] = {};
		if (this.adj[e.target] === undefined) this.adj[e.target] = {};
		this.adj[e.source][e.target] = e.weight;
		this.adj[e.target][e.source] = e.weight;
	}
};

Graph.prototype.makeNodeIdxMap = function() {
	var nidx = {};
	_.each(this.nodes, function(v, i) { nidx[v.name] = i; });
	this.name_to_idx = nidx;
};

Graph.prototype.collapse = function(threshold) {
	var i, j, e;
	var s, t;
	var node_set = new DJSet(this.nodes.length);
	for (i = 0; i < this.edges.length; ++i) {
		e = this.edges[i];
		if (e.weight < threshold) {
			node_set.mergeSets(e.source, e.target);
		}
	}

	var collapse_map = {};
	var collapse = [];
	var out_nodes = [];

	for (i = 0; i < this.nodes.length; ++i) {
		j = node_set.findSetHead(i);
		if (collapse_map[j] === undefined) {
			collapse_map[j] = out_nodes.length;
			out_nodes.push({ ids: [] });
		}
		collapse[i] = collapse_map[j];
		out_nodes[collapse[i]].ids.push(this.nodes[i].name);
	}

	var name_map = {};

	for (i = 0; i < out_nodes.length; ++i) {
		out_nodes[i].name = out_nodes[i].ids.join();
		for (j = 0; j < out_nodes[i].ids.length; ++j) {
			name_map[j] = i;
		}
	}

	var out_edges = [];

	for (i = 0; i < this.edges.length; ++i) {
		e = this.edges[i];
		s = collapse[e.source];
		t = collapse[e.target];
		if (s != t) {
			out_edges.push({ source: s, target: t, weight: e.weight});
		}
	}

	var out = new Graph(out_nodes, out_edges);
	out.name_map = name_map;
	return out;
};
