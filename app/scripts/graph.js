"use strict";

var Graph = function(nodes, edges) {
	this.nodes = nodes;
	this.edges = edges;
	this.makeAdjacency();
	this.makeNodeIdxMap();
};

Graph.prototype.nAdj = function(name) {
	var idx = this.nodeIdx(name);
	return this.adj[idx].length;
};

Graph.prototype.isLeaf = function(name) {
	return this.nAdj(name) == 1;
};

Graph.prototype.leafIndices = function() {
	var result = [];
	for (var i = 0; i < this.nodes.length; ++i) {
		if (this.adj[i].length == 1) {
			result.push(i);
		}
	}
	return result;
};

Graph.prototype.isAcyclic = function() {
	var i, e;
	var node_set = new DJSet(this.nodes.length);
	for (i = 0; i < this.edges.length; ++i) {
		e = this.edges[i];
		if (node_set.sameSet(e.source, e.target)) {
			return false;
		}
		node_set.mergeSets(e.source, e.target);
	}
	return true;
};

// Return an array with an entry per edge containing the number of nodes on one end of the edge (whichever end has fewer attached nodes)
// Only valid for acyclic graphs.
Graph.prototype.calculateEdgeBalance = function() {
	var Nn = this.nodes.length;
	var Ne = this.edges.length;
	// any edge connected to a leaf has balance = 1
	// any edge connected to a node for which all other edges have balances calculated has balance = sum(other balances) + 1
	var i, j, e, ei;
	var balances = [];
	var node_to_edge_ids = [];
	var remaining_degree = [];

	for (i = 0; i < Nn; ++i) {
		node_to_edge_ids.push([]);
		remaining_degree.push(0);
	}

	for (i = 0; i < Ne; ++i) {
		balances.push(0);

		e = this.edges[i];

		node_to_edge_ids[e.source].push(i);
		node_to_edge_ids[e.target].push(i);
		remaining_degree[e.source]++;
		remaining_degree[e.target]++;
	}

	var ready = [];
	for (i = 0; i < Nn; ++i) {
		if (remaining_degree[i] == 1) {
			ready.push(i);
		}
	}

	while (ready.length) {
		i = ready.pop();
		ei = node_to_edge_ids[i][0];
		balances[ei] = 1;
		for (j = 1; j < node_to_edge_ids[i].length; ++j) {
			balances[ei] += balances[node_to_edge_ids[i][j]];
		}

		e = this.edges[ei];

		j = e.source != i ? e.source : e.target;
		if (--remaining_degree[j] == 1) {
			ready.push(j);
		}

		node_to_edge_ids[j].splice(_.indexOf(node_to_edge_ids[j], ei), 1);
		node_to_edge_ids[j].push(ei);
	}

	for (i = 0; i < this.edges.length; ++i) {
		if (balances[i] > Nn / 2) {
			balances[i] = Nn - balances[i];
		}
	}

	return balances;
};

Graph.prototype.leafDistance = function() {
	var open = _.map(this.leafIndices(), function(i) { return { idx: i, dist: 0 }; });
	var heap = new Heap(function(a, b) { return a.dist > b.dist; });
	var closed = [];

	while (open.length) {
		heap.pop(open, open.length);
		var n = open.pop();
		if (closed[n.idx] !== undefined) {
			continue;
		}
		closed[n.idx] = n.dist;

		for (var j = 0; j < this.adj[n.idx].length; ++j) {
			var k = this.adj[n.idx][j];
			if (closed[k] === undefined) {
				heap.push(open, open.length, { idx: k, dist: n.dist + 1 });
			}
		}
	}
	return closed;
};

Graph.prototype.pickCentralNode = function() {
	var ld = this.leafDistance();
	var best = 0;
	for (var i = 1; i < ld.length; ++i) {
		if (ld[best] < ld[i]) {
			best = i;
		}
	}
	return this.nodes[best].name;
};

Graph.prototype.nodeIdx = function(name) {
	return this.name_to_idx[name];
};

Graph.prototype.mappedNodeIdx = function(name) {
	if (this.name_map !== undefined) {
		return this.nodeIdx(this.name_map[name]);
	} else {
		return this.nodeIdx(name);
	}
};

Graph.prototype.neighbourhoodIds = function(name, radius) {
	var self = this;

	var start_idx = this.nodeIdx(name);
	if (start_idx === undefined) {
		return [];
	}

	var open = [ {idx: start_idx, dist: 0} ];
	var heap = new Heap(function(a, b) { return a.dist > b.dist; });
	var closed = {};
	while (open.length) {
		heap.pop(open, open.length);
		var n = open.pop();
		if (closed[n.idx]) {
			continue;
		}

		closed[n.idx] = true;
		if (n.dist < radius) {
			for (var j = 0; j < this.adj[n.idx].length; ++j) {
				var k = this.adj[n.idx][j];
				if (!closed[k]) {
					heap.push(open, open.length, { idx: k, dist: n.dist + 1 });
				}
			}
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

	_.each(this.nodes, function(v) {
		if (keydict[v.name] !== undefined) {
			out_nodes[keydict[v.name]] = _.extend({}, v);
		}
	});

	_.each(this.edges, function(v) {
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
	var adj = [];
	_.each(this.nodes, function() { adj.push([]); });

	for (var i = 0; i < this.edges.length; ++i) {
		var e = this.edges[i];
		adj[e.source].push(e.target);
		adj[e.target].push(e.source);
	}

	_.each(adj, function(v) { v.sort(); });

	this.adj = adj;
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
