"use strict";

var DJSet = function(N) {
    this.reset(N);
};

DJSet.prototype.reset = function(N) {
    this.n_sets = N;
    this.set = [];
    for (var i = 0; i < N; ++i) {
        this.set.push([i, 0]);
    }
};

DJSet.prototype.findSetHead = function(a) {
    var a_head;
    if (a === this.set[a][0]) {
        return a;
    }

    a_head = a;
    while (this.set[a_head][0] != a_head) {
        a_head = this.set[a_head][0];
    }

    this.set[a] = [ a_head, this.set[a][1] ];
    return a_head;
};

DJSet.prototype.sameSet = function(a, b) {
    return this.findSetHead(a) == this.findSetHead(b);
};

DJSet.prototype.mergeSets = function(a, b) {
    a = this.findSetHead(a);
    b = this.findSetHead(b);
    if (a != b) {
        this.n_sets -= 1;
        if (this.set[a][1] < this.set[b][1]) {
            this.set[a] = [ b, this.set[a][1] ];
        } else if (this.set[b][1] < this.set[a][1]) {
            this.set[b] = [ a, this.set[b][1] ];
        } else {
            this.set[a] = [ this.set[a][0], this.set[a][1] + 1 ];
            this.set[b] = [ a, this.set[b][1] ];
        }
    }
};
