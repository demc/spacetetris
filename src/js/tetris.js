(function (global) {
    Tetris = global.Tetris || {};
    Tetris.Game = global.Tetris.Game || {};
    Tetris.UI = global.Tetris.UI || {};

    var canvas, ctx, scoreboard, preview, previewCtx;

    var ScoreBoard = {
        next: null,
        score: null,
        lines: null
    };

    Tetris.hopper = {
        items: [],

        next: function () {
            if (Tetris.active == null && this.items.length > 0) {
                Tetris.active = this.items.shift();
                Tetris.active.init();
            }

            if (this.items.length === 0) {
                Tetris.hopper.load();
            }

            Tetris.drawPreview();
        },

        load: function () {
            var possible = [Tetris.O,
                            Tetris.L,
                            Tetris.J,
                            Tetris.I,
                            Tetris.Z,
                            Tetris.S,
                            Tetris.T];

            possible.sort(function (a, b) {
                var r = Math.random();
                if (r < 0.5)
                    return -1;
                else
                    return 1;
            });

            possible.forEach(function (te) {
                Tetris.hopper.items.push(new te());
            });
        }
    };

    var Keys = {
        UP:     38,
        DOWN:   40,
        LEFT:   37,
        RIGHT:  39,
        C:      67,
        F:      70,
        P:      80,
        SPACE:  32,
        ESC:    27
    };

    function handleKeyDown(e) {
        switch (e.keyCode) {
            case Keys.LEFT:
            case Keys.RIGHT:
                if (Tetris.active) {
                    if (e.keyCode == Keys.RIGHT) {
                        handleRight();
                    }
                    else {
                        handleLeft();
                    }
                }
                break;
            case Keys.UP:
                handleRotate();
                break;
            case Keys.DOWN:
                handleDown();
                break;
            case Keys.SPACE:
                handleSpaceDown();
                break;
        }
    }

    function handleKeyUp(e) {
        switch (e.keyCode) {
            case Keys.DOWN:
                handleDownUp();
                break;
            case Keys.SPACE:
                handleSpaceUp();
                break;
            case Keys.P:
                handlePauseUp();
                break;
            case Keys.ESC:
                handleEscUp();
                break;
        }
    }

    function handleRight() {
        var rm = Tetris.active.findRightMost();

        if (rm[0] < 9 && Tetris.grid.tiles[rm[0] + 1][rm[1]] == null)
            Tetris.active.moveRight();
    }

    function handleLeft() {
        var lm = Tetris.active.findLeftMost();

        if (lm[0] > 0 && Tetris.grid.tiles[lm[0] - 1][lm[1]] == null)
            Tetris.active.moveLeft();
    }

    function handleRotate() {
        if (Tetris.active && Tetris.active.rotate) {
            Tetris.active.rotate();
        }
    }

    function handleDown() {
        if (Tetris.active) {
            JumpRope.stop();
            Tetris.active.moveDown();
        }
    }

    function handleDownUp() {
        JumpRope.single(loop, Tetris.timeout);
    }

    function handleSpaceDown() {
        if (Tetris.active) {
            JumpRope.stop();
            Tetris.active.hardDrop();
        }
    }

    function handleSpaceUp() {
        JumpRope.single(loop, Tetris.timeout);
    }

    function handlePauseUp() {
        if (Tetris.Game.isPaused()) {
            Tetris.UI.resume();
        }
        else {
            Tetris.UI.pause();
        }
    }

    function handleEscUp() {
        // Somewhat bad assumption - game could be paused with inconsistent UI
        if (Tetris.Game.isPaused()) {
            Tetris.UI.resume();
        }
    }

    // function handleScoreSubmit(playername, points, lines) {
    //     return new WinJS.Promise(function (c, e, p) {
    //         if (playername.length > 3) {
    //             var score = {
    //                 playername: playername,
    //                 points: points,
    //                 table: 'highscores',
    //                 allowduplicates: true,
    //                 fields: {
    //                     lines: lines
    //                 }
    //             };

    //             Playtomic.Leaderboards.save(score, function (response) {
    //                 if (response.success) {
    //                     c();
    //                 }
    //                 else {
    //                     e('Failed to submit score');
    //                 }
    //             });
    //         }
    //         else {
    //             e('Player name must be at least 3 characters long.');
    //         }
    //     });
    // }

    Tetris.UI.pause = function () {
        Tetris.Game.pause();

        GlobalFlyout.reset();

        if (!GlobalFlyout.panes.PAUSED) {
            GlobalFlyout.createPane('PAUSED', 'Paused', null, {
                'Resume': Tetris.UI.resume,
                'New Game': Tetris.UI.newGame,
                'Home': Tetris.utils.navigateHome
            });
        }

        GlobalFlyout.addDismissListener(Tetris.Game.resume, true);

        GlobalFlyout.selectedPane(GlobalFlyout.panes.PAUSED);
        GlobalFlyout.show();
    };

    Tetris.Game.pause = function () {
        Tetris.Game._paused = true;
        JumpRope.stop();
    };

    Tetris.Game.isPaused = function () {
        return Tetris.Game._paused;
    };

    Tetris.UI.resume = function () {
        GlobalFlyout.hide();
        Tetris.Game.resume();
    };

    Tetris.Game.resume = function () {
        Tetris.Game._paused = false;
        JumpRope.single(loop, Tetris.timeout);
    };

    Tetris.UI.newGame = function () {
        GlobalFlyout.hide();
        Tetris.Game.newGame();
    };

    Tetris.Game.newGame = function () {
        Tetris.active = null;
        Tetris.paused = false;
        Tetris.clearScoreBoard();

        init();
    };

    Tetris.UI.gameover = function () {
        Tetris.Game.gameover();

        // TODO: replace crappy flyout with sliding flyout view
        var flyout = document.getElementById('highscore-flyout');
        var msg = 'Score: ' + ScoreBoard.score.innerText + '   Lines: ' + ScoreBoard.lines.innerText;

        GlobalFlyout.reset();

        if (!GlobalFlyout.panes.GAME_OVER) {
            GlobalFlyout.createPane('GAME_OVER', 'Game Over!', msg, {
                // 'Submit score': function () {
                //     GlobalFlyout.selectedPane(GlobalFlyout.panes.SUBMIT_SCORE);
                //     GlobalFlyout.selectedPane().message(msg);
                // },
                'New Game': Tetris.UI.newGame,
                'Home': Tetris.utils.navigateHome
            });

            GlobalFlyout.panes.GAME_OVER.dismissible(false);
            // TODO: remove
            //GlobalFlyout.addButton('Submit score', function () {
            //    flyout.winControl.show(canvas);

            //    handleScoreSubmit()
            //        .done(function () {
            //            flyout.winControl.hide();
            //            this.style.display = 'none';
            //        }, function (error) {
            //            GlobalFlyout.message(msg + '     -    Error submitting score. Please try again');
            //        });
            //});
        }

        if (!GlobalFlyout.panes.SUBMIT_SCORE) {
            GlobalFlyout.createPane('SUBMIT_SCORE', 'Submit score', null, {
                'Submit': function (item, e) {
                    var playername = document.getElementById('playername');

                    if (playername.value.length >= 3) {
                        playername.disabled = true;

                        GlobalFlyout.selectedPane().loading(true);

                        handleScoreSubmit(
                            playername.value, 
                            parseInt(ScoreBoard.score.innerText),
                            parseInt(ScoreBoard.lines.innerText))
                            .then(function () {
                                GlobalFlyout.selectedPane().loading(false);
                                Tetris.utils.navigateToHighScores();     
                            },
                            function (err) {
                                GlobalFlyout.selectedPane().loading(false);
                                GlobalFlyout.selectedPane().addError('submit', err);
                            });
                    }
                    else {
                        if (GlobalFlyout.selectedPane().errors().length === 0) {
                            GlobalFlyout.selectedPane().addError('validation', 'Your player name must be at least 3 characters long.');
                        }
                    }
                },
                'Cancel': function () {
                    GlobalFlyout.selectedPane(GlobalFlyout.panes.GAME_OVER); 
                }
            });

            GlobalFlyout.panes.SUBMIT_SCORE.addField('Player name', 'text', 'playername');
            GlobalFlyout.panes.SUBMIT_SCORE.dismissible(false);
        }

        GlobalFlyout.selectedPane(GlobalFlyout.panes.GAME_OVER);
        GlobalFlyout.selectedPane().message(msg);
        GlobalFlyout.show();
    };

    Tetris.Game.gameover = function () {
        JumpRope.stop();
        Tetris.active = null;

        window.removeEventListener('keydown', handleKeyDown, false);
        window.removeEventListener('keyup', handleKeyUp, false);

        Tetris.draw();
    };

    Tetris.updateScoreBoard = function (linesCleared) {
        var lines = parseInt(ScoreBoard.lines.innerText) + linesCleared,
            score = parseInt(ScoreBoard.score.innerText) + 10 * linesCleared;

        if (linesCleared === 4)
            score += 10;

        ScoreBoard.lines.innerText = lines;
        ScoreBoard.score.innerText = score;
    };

    Tetris.clearScoreBoard = function () {
        ScoreBoard.lines.innerText = '00';
        ScoreBoard.score.innerText = '00';
        Tetris.clearPreview();
    };

    Tetris.clearRows = function (cords) {
        JumpRope.stop();
        cords = cords.createYSet();

        var cleared = [];

        for (var i = 0; i < cords.length; i++) {
            var occuppied = true,
                y = cords[i];

            for (var x = 0; x < Tetris.grid.width && occuppied; x++) {
                if (Tetris.grid.tiles[x][y] == null)
                    occuppied = false;

                if (x == 9 && occuppied) {
                    cleared.push(y);
                }
            }
        }

        if (cleared.length > 0) {
            cleared.sort(function (a, b) {
                if (a < b) return 1;
                if (a > b) return -1;
                return 0;
            });

            var upper = cleared[0],
                lower = cleared[cleared.length - 1],
                diff = upper - lower + 1;

            for (var yi = upper; yi >= 0; yi--) {
                for (var xi = 0; xi < Tetris.grid.width; xi++) {
                    var tile = Tetris.grid.tiles[xi][yi - diff];
                    Tetris.grid.tiles[xi][yi] = (tile === undefined) ? null : tile;
                }
            }

            Tetris.timeout *= 0.95;
        }

        Tetris.active = null;
        return cleared.length;
    }

    Tetris.next = function () {
        Tetris.hopper.next();
        JumpRope.single(loop, Tetris.timeout);
    };

    /**
     * Given an array of y cordinates, make those rows flash.
     */
    Tetris.flash = function (clearedRows) {
        var tiles = Tetris.grid.tiles;

        clearedRows.forEach(function (y) {
            for (var x = 0; x < Tetris.grid.width; x++) {
                tiles[x][y].altColor = tiles[x][y].color;
                tiles[x][y].color = 'white';
            }
        });

        Tetris.draw();
    };

    function applyBackground() {
        var tileSize = Tetris.grid.tileSize;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.strokeStyle = '#FFFFFF';

        for (var y = Tetris.grid.height; y >= 0; y--) {
            for (var x = Tetris.grid.width; x > 0; x--) {
                ctx.strokeRect(x * tileSize, y * tileSize, 0.5, 0.5);
            }
        }
    }

    var draw = Tetris.draw = function (callback) {
        var t = Tetris.grid.tiles,
            tileSize = Tetris.grid.tileSize,
            found = false,
            offset = 0,
            midSize = tileSize / 2,
            padding = midSize / 2;

        applyBackground();

        for (var x = 0; x < Tetris.grid.width; x++) {
            for (var y = 2; y < Tetris.grid.height; y++) {

                if (t[x][y]) {
                    ctx.fillStyle = t[x][y].color;
                    ctx.fillRect(x * tileSize + 1, (y - 2) * tileSize + 1, tileSize - 2, tileSize - 2);

                    ctx.fillStyle = t[x][y].colorAlternate;
                    ctx.fillRect(x * tileSize + padding, (y - 2) * tileSize + padding, midSize, midSize);

                    ctx.lineWidth = '2';
                    ctx.strokeStyle = t[x][y].borderColor;
                    ctx.strokeRect(x * tileSize + 1, (y - 2) * tileSize + 1, tileSize - 1, tileSize - 1);
                    ctx.stroke();
                }
            }
        }

        if (Tetris.active) {
            while (!found) {
                for (var i = 0; i < Tetris.active.cords.length; i++) {
                    var cord = Tetris.active.cords[i],
                        tile = t[cord[0]][cord[1] + offset];

                    if (tile !== Tetris.active && tile != null && tile != this || tile === undefined) {
                        found = true;
                        break;
                    }

                    if (i === Tetris.active.cords.length - 1) {
                        offset++;
                    }
                }
            }

            if (offset > 5) {
                for (var i = 0; i < Tetris.active.cords.length; i++) {
                    var cord = Tetris.active.cords[i],
                        x = cord[0],
                        y = cord[1] + offset - 1;

                    ctx.fillStyle = '#CCCCCC';
                    ctx.fillRect(x * tileSize + 1, (y - 2) * tileSize + 1, tileSize - 2, tileSize - 2);

                    ctx.fillStyle = '#888888';
                    ctx.fillRect(x * tileSize + padding, (y - 2) * tileSize + padding, midSize, midSize);

                    ctx.lineWidth = '2';
                    ctx.strokeStyle = '#888888';
                    ctx.strokeRect(x * tileSize + 1, (y - 2) * tileSize + 1, tileSize - 1, tileSize - 1);
                    ctx.stroke();
                }
            }
        }

        if (callback)
            callback();
    }

    Tetris.clearPreview = function () {
        previewCtx.clearRect(0, 0, previewCtx.canvas.width, previewCtx.canvas.height);
    };

    Tetris.drawPreview = function () {
        var next = Tetris.hopper.items[0],
            tileSize = Tetris.preview.tileSize,
            midSize = tileSize / 2,
            padding = midSize / 2;

        Tetris.clearPreview();

        previewCtx.strokeStyle = next.borderColor;
        previewCtx.fillStyle = next.color;

        if (next instanceof Tetris.I) {

            previewCtx.strokeRect(1 * tileSize, 1 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 1 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(1 * tileSize, 2 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 2 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(1 * tileSize, 3 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 3 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(1 * tileSize, 4 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 4 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.fillStyle = next.colorAlternate;

            previewCtx.fillRect(1 * tileSize + padding, 1 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(1 * tileSize + padding, 2 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(1 * tileSize + padding, 3 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(1 * tileSize + padding, 4 * tileSize + padding, midSize, midSize);
        }
        else if (next instanceof Tetris.J) {

            previewCtx.strokeRect(2 * tileSize, 1 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(2 * tileSize + 1, 1 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(2 * tileSize, 2 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(2 * tileSize + 1, 2 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(2 * tileSize, 3 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(2 * tileSize + 1, 3 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(1 * tileSize, 3 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 3 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.fillStyle = next.colorAlternate;

            previewCtx.fillRect(2 * tileSize + padding, 1 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(2 * tileSize + padding, 2 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(2 * tileSize + padding, 3 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(1 * tileSize + padding, 3 * tileSize + padding, midSize, midSize);
        }
        else if (next instanceof Tetris.L) {

            previewCtx.strokeRect(1 * tileSize, 1 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 1 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(1 * tileSize, 2 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 2 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(1 * tileSize, 3 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 3 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(2 * tileSize, 3 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(2 * tileSize + 1, 3 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.fillStyle = next.colorAlternate;

            previewCtx.fillRect(1 * tileSize + padding, 1 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(1 * tileSize + padding, 2 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(1 * tileSize + padding, 3 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(2 * tileSize + padding, 3 * tileSize + padding, midSize, midSize);
        }
        else if (next instanceof Tetris.O) {

            previewCtx.strokeRect(1 * tileSize, 1 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 1 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(2 * tileSize, 1 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(2 * tileSize + 1, 1 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(1 * tileSize, 2 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 2 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(2 * tileSize, 2 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(2 * tileSize + 1, 2 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.fillStyle = next.colorAlternate;

            previewCtx.fillRect(1 * tileSize + padding, 1 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(2 * tileSize + padding, 1 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(1 * tileSize + padding, 2 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(2 * tileSize + padding, 2 * tileSize + padding, midSize, midSize);
        }
        else if (next instanceof Tetris.S) {

            previewCtx.strokeRect(2 * tileSize, 1 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(2 * tileSize + 1, 1 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(1 * tileSize, 1 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 1 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(1 * tileSize, 2 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 2 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(0 * tileSize, 2 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(0 * tileSize + 1, 2 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.fillStyle = next.colorAlternate;

            previewCtx.fillRect(2 * tileSize + padding, 1 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(1 * tileSize + padding, 1 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(1 * tileSize + padding, 2 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(0 * tileSize + padding, 2 * tileSize + padding, midSize, midSize);
        }
        else if (next instanceof Tetris.T) {

            previewCtx.strokeRect(1 * tileSize, 1 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 1 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(1 * tileSize, 2 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 2 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(2 * tileSize, 2 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(2 * tileSize + 1, 2 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(1 * tileSize, 3 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 3 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.fillStyle = next.colorAlternate;

            previewCtx.fillRect(1 * tileSize + padding, 1 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(1 * tileSize + padding, 2 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(2 * tileSize + padding, 2 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(1 * tileSize + padding, 3 * tileSize + padding, midSize, midSize);
        }
        else if (next instanceof Tetris.Z) {

            previewCtx.strokeRect(0 * tileSize, 1 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(0 * tileSize + 1, 1 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(1 * tileSize, 1 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 1 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(1 * tileSize, 2 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(1 * tileSize + 1, 2 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.strokeRect(2 * tileSize, 2 * tileSize, tileSize, tileSize);
            previewCtx.fillRect(2 * tileSize + 1, 2 * tileSize + 1, tileSize - 2, tileSize - 2);

            previewCtx.fillStyle = next.colorAlternate;

            previewCtx.fillRect(0 * tileSize + padding, 1 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(1 * tileSize + padding, 1 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(1 * tileSize + padding, 2 * tileSize + padding, midSize, midSize);
            previewCtx.fillRect(2 * tileSize + padding, 2 * tileSize + padding, midSize, midSize);
        }
    };

    var loop = Tetris.loop = function () {
        if (Tetris.active) {
            Tetris.active.moveDown();
        }
    }

    function resize() {
        if (canvas.width) {
            Tetris.grid.tileSize = canvas.width / 10;
            canvas.height = Tetris.grid.tileSize * 20;  
        }
        else {
            canvas.width = window.innerHeight / 2;
            Tetris.grid.tileSize = canvas.width / 10;
        }
    }

    function doLayout(state, isResize) {
        // TODO: invert dependencies to get Win8 app working again
        var avs = { fullScreenLandscape: 'foo' };
        // var avs = Windows.UI.ViewManagement.ApplicationViewState,
        //     currentView = Windows.UI.ViewManagement.ApplicationView.value;

        if (isResize)
            Tetris.Game.pause();

        switch (state) {
            case 'LARGE':
            case 'MEDIUM':
            case avs.fullScreenLandscape:
            case avs.filled:

                canvas.width = null;
                canvas.height = window.innerHeight;
                canvas.className = 'default';
                break;

            case 'SMALL':
            case avs.snapped:

                var remainingHeight = window.innerHeight - 20 - 152,
                    tileSize = remainingHeight / 20,
                    width = tileSize * 10; 
      
                canvas.width = width;
                canvas.className = 'snap';
                break;
        }
        
        resize();
        doScoreBoard(state, isResize);

        if (isResize) {
            Tetris.draw();
            Tetris.drawPreview();
            Tetris.Game.resume();
        }
    }

    function doScoreBoard(state, isResize) {
        // TODO: invert dependencies to get Win8 app working again
        var avs = { fullScreenLandscape: 'foo' },
        // var avs = Windows.UI.ViewManagement.ApplicationViewState,
        //     currentView = Windows.UI.ViewManagement.ApplicationView.value,
            scoreboardVertical = document.getElementById('scoreboard-vertical'),
            scoreboardHorizontal = document.getElementById('scoreboard-horizontal');

        switch (state) {
            case 'LARGE':
            case 'MEDIUM':
            case avs.fullScreenLandscape:
            case avs.filled:

                scoreboardVertical.style.display = 'block';
                scoreboardHorizontal.style.display = 'none';

                scoreboard = scoreboardVertical;
                scoreboard.style.left = canvas.offsetLeft + canvas.width + 16 + 'px';

                ScoreBoard.next = document.getElementById('scoreboard-next-vertical');
                ScoreBoard.score = document.getElementById('scoreboard-score-vertical');
                ScoreBoard.lines = document.getElementById('scoreboard-lines-vertical');

                preview = document.getElementById('scoreboard-next-vertical');
                break;

            case 'SMALL':
            case avs.snapped:
                
                scoreboardVertical.style.display = 'none';
                scoreboardHorizontal.style.display = 'block';

                scoreboard = scoreboardHorizontal;

                scoreboard.style.width = canvas.width + 4 + 'px';

                ScoreBoard.next = document.getElementById('scoreboard-next-horizontal');
                ScoreBoard.score = document.getElementById('scoreboard-score-horizontal');
                ScoreBoard.lines = document.getElementById('scoreboard-lines-horizontal');

                preview = document.getElementById('scoreboard-next-horizontal');
                break;
        }

        previewCtx = preview.getContext('2d');

        Tetris.preview.tileSize = Tetris.grid.tileSize / 2;
        previewCtx.canvas.height = Tetris.preview.tileSize * 4;
        previewCtx.canvas.width = Tetris.preview.tileSize * 4;
    }

    function init() {
        for (var x = 0; x < Tetris.grid.width; x++) {
            if (Tetris.grid.tiles[x] === undefined)
                Tetris.grid.tiles[x] = [];

            for (var y = 0; y < Tetris.grid.height; y++)
                Tetris.grid.tiles[x][y] = null;
        }

        global.addEventListener('keydown', handleKeyDown, false);
        global.addEventListener('keyup', handleKeyUp, false);

        Tetris.timeout = 1000;

        Tetris.hopper.load();
        Tetris.hopper.next();

        draw();
        JumpRope.single(loop, Tetris.timeout);

        // TODO: how will multiplayer work?
        //Tetris.MultiplayerWorker.create();
    }

    Tetris.Game.init = function () {
        if (typeof WinJS !== 'undefined') {
            // TODO: invert dependencies
            WinJS.UI.processAll();  
        } 
      
        canvas = document.querySelector('#grid');
        ctx = canvas.getContext('2d');

        Tetris.active = null;
        Tetris.timeout = 1000;
        Tetris.interval = null;
        Tetris.paused = false;
        Tetris.viewport = new Viewport(window);

        Tetris.grid = {
            width: 10,
            height: 22,
            tileSize: ctx.canvas.width / 10,
            tiles: [],
        };

        Tetris.preview = {
            width: null,
            height: null,
            tileSize: null
        };

        Tetris.viewport.subscribe(function (info) {
            doLayout(info.state, true);
        });

        doLayout(Tetris.viewport.getState(), false);
        init();
    }
})(this);