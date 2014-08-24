Tetris.MultiplayerWorker = (function () {
    "use strict";

    var url = 'ws://127.0.0.1:3000'

    function connect() {
        try {
            var ws = new WebSocket(url);

            ws.onopen(function () {
                console.log('connection to server openned');
            });
        }
        catch (ex) {
            console.log(ex.message);
        }
    }

    return {
        create: function () {
            connect();
        }
    };
})();