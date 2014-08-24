Array.prototype.contains = function (item) {
    var i = this.length;

    while (i--) {
        if (this[i] === item)
            return true;
    }

    return false;
};

Array.prototype.clone = function () {
    var clone = [],
        i = this.length;

    while (i--) {
        if (Array.isArray(this[i])) {
            clone[i] = this[i].clone();
        }
        else {
            clone[i] = this[i];
        }
    }

    return clone;
};

Array.prototype.createYSet = function () {
    var tmp = [];

    for (var i = 0; i < this.length; i++) {
        var y = this[i][1];

        if (!tmp.contains(y))
            tmp.push(y);
    }

    return tmp;
};
