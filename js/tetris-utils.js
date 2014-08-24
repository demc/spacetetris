(function (global) {
    Tetris = global.Tetris || {};
    Tetris.utils = global.Tetris.utils || {};

    Tetris.utils.initBackground = function () {
        var TRANSITION_TIMEOUT = 30000,
            background1 = document.getElementById('background-1'),
            background2 = document.getElementById('background-2'),
            baseDir = '/images/backgrounds/',
            manifest = [
                'brunier-southpole-fisheye.jpg',
                'andromeda.jpg',
                'hubble-strobe-star.jpg',
                'lupus.jpg',
                'setting-dark-on-fire.jpg',
                'supernova.jpg',
                'westerlund-star-cluster.jpg'
            ],
            active = background1,
            inactive = background2,
            index = 0;

        manifest.forEach(function (imgName) {
            var img = new Image();
            img.src = baseDir + imgName;
        });

        function rotate() {
            var img, tmp;

            // Setup next background.
            next();
            img = 'url(' + baseDir + manifest[index] + ')';
            inactive.style.backgroundImage = img;

            // Transition at different speeds to avoid 'whiteout' affect.
            inactive.style.webkitTransition = 'opacity 1000ms linear';
            active.style.webkitTransition = 'opacity 2000ms linear';

            // Image transition.
            inactive.style.opacity = 1;
            active.style.opacity = 0;    

            // Swap active and inactive.
            tmp = active;
            active = inactive;
            inactive = tmp; 

            setTimeout(rotate, TRANSITION_TIMEOUT);
        }

        function next() {
            index = ++index % manifest.length;
        }

        setTimeout(rotate, TRANSITION_TIMEOUT);
    };

    Tetris.utils.navigateHome = function () {
        window.location = '/index.html';
    };

    Tetris.utils.navigateToHighScores = function () {
        window.location = '/highscores.html';
    };
})(this);