"use strict";

var Heap = function(pred) {
    this.pred = pred || function (a,b) { return a < b; };
};

Heap.prototype.isHeap = function(array, len) {
    var parent = 0;

    for (var child = 1; child < len; ++child) {
        if (this.pred(array[parent], array[child])) {
            return false;
        }
        if (++child == len) {
            break;
        }
        if (this.pred(array[parent], array[child])) {
            return false;
        }
        ++parent;
    }
    return true;
};

Heap.prototype.remove = function(array, pos, len) {
    --len;
    if (pos != len) {
        var removed = array[pos];
        this.adjust(array, pos, len, array[len]);
        array[len] = removed;
    }
};

Heap.prototype.pop = function(array, len) {
    this.remove(array, 0, len);
};

Heap.prototype.sort = function(array, len) {
    while (len > 1) {
        this.remove(array, 0, len--);
    }
};

Heap.prototype.push = function(array, pos, val) {
    var parent = (pos - 1) >> 1;
    while (pos > 0 && this.pred(array[parent], val)) {
        array[pos] = array[parent];
        pos = parent;
        parent = (pos - 1) >> 1;
    }
    array[pos] = val;
};

Heap.prototype.adjust = function(array, pos, len, val) {
    var top = pos;
    var child = pos * 2 + 2;
    while (child < len) {
        if (this.pred(array[child], array[child-1])) --child;
        array[pos] = array[child];
        pos = child;
        child = pos * 2 + 2;
    }
    if (child == len) {
        --child;
        array[pos] = array[child];
        pos = child;
    }
    var parent = (pos - 1) >> 1;
    while (pos > top && this.pred(array[parent], val)) {
        array[pos] = array[parent];
        pos = parent;
        parent = (pos - 1) >> 1;
    }
    array[pos] = val;
};

Heap.prototype.make = function(array, len) {
    for (var pos = len >> 1; pos > 0;) {
        --pos;
        this.adjust(array, pos, len, array[pos]);
    }
};
