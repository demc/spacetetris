JumpRope = (function() {
    var intervals = [];

    return {
        go: function (fn, interval) {
            intervals.push(setInterval(fn, interval));
        },

        single: function (fn, interval) {
            if (intervals.length > 0)
                this.stop();

            this.go(fn, interval);
        },

        stop: function () {
            intervals.forEach(function (i) {
                clearInterval(i);
            });
        }
    };
})();