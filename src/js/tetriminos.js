(function (global) {
    Tetris = global.Tetris || {};
    Tetris.utils = global.Tetris.utils || {};

    // Directions Enumerator
    Tetris.Directions = {
        NORTH: 0,
        SOUTH: 1,
        EAST: 2,
        WEST: 3
    };

    /**
     * Given an array [x, y] checks that there are no
     * tiles occuping that space.
     */
    Tetris.utils.isEmpty = function (cords) {
        var x = Tetris.grid.tiles[cords[0]],
            y;

        if (typeof x === 'undefined')
            return false;

        y = x[cords[1]];

        //if (y === Tetris.active) {
        //    console.log('conflict');
        //}

        if (typeof y === 'undefined')
            return false;

        return (y == null);
    };

    /**
     * Tetrimino Base Class
     *
     * cords is an array of cordinates where the first
     * index is the pair and the second index is the actual
     * x or y value. The second index is mapped to x and y as 
     * 0 and 1 respectively.
     */
    Tetris.Tetrimino = function (c, ca, bc, bca) {
        this.color = c;
        this.colorAlternate = ca;
        this.borderColor = bc;
        this.borderColorAlternate = bca;
        this.direction = Tetris.Directions.NORTH;
        this.cords = []; // array of cordinates 
        this.rightMost = null;
        this.leftMost = null;
        this.lowest = null;
        this.isRotating = false;
    };

    /**
     * Base init function. Only checks if game should end.
     */
    Tetris.Tetrimino.prototype.init = function () {
        var isEmpty = Tetris.utils.isEmpty;

        if (!(isEmpty(this.cords[0]) && isEmpty(this.cords[1]) && isEmpty(this.cords[2]) && isEmpty(this.cords[3]))) {
            Tetris.UI.gameover();
        }
        else {
            for (var i = 0; i < this.cords.length; i++) {
                Tetris.grid.tiles[this.cords[i][0]][this.cords[i][1]] = this;
            }
        }
    };

    /**
     * Breaks apart a Tetrimino object into separate Block
     * objects to be more memory efficient and to improve
     * row clearing algorithm.
     */
    Tetris.Tetrimino.prototype.disband = function () {
        var cords = this.cords,
            tiles = Tetris.grid.tiles;

        for (var i = 0; i < cords.length; i++) {
            var x = cords[i][0],
                y = cords[i][1],
                block = new Tetris.Block(x, y, this);

            delete tiles[x][y];
            tiles[x][y] = block;
        }

        return cords;
    }

    Tetris.Tetrimino.prototype.findRightMost = function () {
        var rm = null;

        for (var i = 3; i >= 0; i--) {
            var cord = this.cords[i];

            if (rm == null || cord[0] > rm[0])
                rm = cord;
        }

        return rm;
    };

    Tetris.Tetrimino.prototype.findLeftMost = function () {
        var lm = null;

        for (var i = 3; i >= 0; i--) {
            var cord = this.cords[i];

            if (lm == null || cord[0] < lm[0])
                lm = cord;
        }

        return lm;
    };

    Tetris.Tetrimino.prototype.findLowest = function () {
        var low = null;

        for (var i = 0; i < 4; i++) {
            var cord = this.cords[i];

            if (low == null || cord[1] > low)
                low = cord[1];
        }

        this.lowest = low;
        return low;
    };

    Tetris.Tetrimino.prototype.hardDrop = function () {
        var tiles = Tetris.grid.tiles,
            orig = this.cords.clone(),
            found = false,
            offset = 0,
            rowsCleared = -1;

        // sort by y desc
        //orig.sort(function (a, b) {
        //    if (a[1] > b[1]) {
        //        return -1;
        //    }

        //    if (a[1] < b[1]) {
        //        return 1;
        //    }

        //    return 0;
        //});

        while (!found) {
            for (var i = 0; i < this.cords.length; i++) {
                var cord = this.cords[i],
                    tile = tiles[cord[0]][cord[1] + offset];

                if (tile != null && tile != this || tile === undefined) {
                    found = true;
                    break;
                }

                if (i === this.cords.length - 1) {
                    offset++;
                }
            }
        }

        for (var i = 0; i < orig.length; i++) {
            var cord = orig[i];
            tiles[cord[0]][cord[1]] = null;
        }

        for (var i = 0; i < this.cords.length; i++) {
            var cord = this.cords[i];
            cord[1] = cord[1] + offset - 1;
            tiles[cord[0]][cord[1]] = this;
        }

        var cords = this.disband();
        rowsCleared = Tetris.clearRows(cords);

        if (rowsCleared > 0) {
            Tetris.updateScoreBoard(rowsCleared);
        }

        Tetris.next();
        Tetris.draw();
    };

    Tetris.Tetrimino.prototype.moveDown = function () {
        var tiles = Tetris.grid.tiles,
            valid = true,
            rowsCleared = -1;

        Tetris.draw();

        for (var i = 0; i < this.cords.length; i++) {
            var cord = this.cords[i],
                tile = tiles[cord[0]][cord[1] + 1];

            if (tile != null && tile != this || tile === undefined) {
                var cords = this.disband();
                rowsCleared = Tetris.clearRows(cords);

                if (rowsCleared > 0) {
                    Tetris.updateScoreBoard(rowsCleared);
                }

                break;
            }
        }

        if (Tetris.active) {
            for (var x = 0; x < tiles.length; x++) {
                for (var y = tiles[x].length - 1; y >= 0; y--) {

                    if (tiles[x][y] === this) {
                        tiles[x][y + 1] = tiles[x][y];
                        tiles[x][y] = null;
                    }
                }
            }

            for (var i = 0; i < 4; i++) {
                this.cords[i][1]++;
            }
        }
        else {
            Tetris.next();
        }

        // Comment in for debugging 
        //var debug = document.getElementById('debug');
        //var out = '';

        //for (var y = 0; y < Tetris.grid.height; y++) {
        //    for (var x = 0; x < Tetris.grid.width; x++) {
        //        if (tiles[x][y] == null) {
        //            out += '.';
        //        }
        //        else {
        //            out += 'X';
        //        }
        //    }

        //    out += '<br/>';
        //}

        //debug.innerHTML = out;


    };

    Tetris.Tetrimino.prototype.moveRight = function () {
        var tiles = Tetris.grid.tiles,
            valid = true;

        for (var i = 0; i < this.cords.length; i++) {
            var cord = this.cords[i],
                tile = tiles[cord[0] + 1][cord[1]];

            if (tile != null && tile != this) {
                valid = false
                break;
            }
        }

        if (valid) {
            // TODO: what is the overhead on this algo?
            for (var x = tiles.length - 1; x >= 0; x--) {
                for (var y = 0; y < tiles[x].length; y++) {
                    if (tiles[x][y] == this) {
                        tiles[x + 1][y] = tiles[x][y];
                        tiles[x][y] = null;
                    }
                }
            }

            for (var i = 0; i < 4; i++)
                this.cords[i][0]++;

            Tetris.draw();
        }
    };

    Tetris.Tetrimino.prototype.moveLeft = function () {
        var tiles = Tetris.grid.tiles,
            valid = true;

        for (var i = 0; i < this.cords.length; i++) {
            var cord = this.cords[i],
                tile = tiles[cord[0] - 1][cord[1]];

            if (tile != null && tile != this) {
                valid = false
                break;
            }
        }

        if (valid) {
            for (var x = 0; x < tiles.length; x++) {
                for (var y = 0; y < tiles[x].length; y++) {
                    if (tiles[x][y] == this) {
                        tiles[x - 1][y] = tiles[x][y];
                        tiles[x][y] = null;
                    }
                }
            }

            for (var i = 0; i < 4; i++)
                this.cords[i][0]--;

            Tetris.draw();
        }
    };

    Tetris.Block = function (x, y, tetrimino) {
        this.x = x;
        this.y = y;
        this.color = tetrimino.color;
        this.colorAlternate = tetrimino.colorAlternate;
        this.borderColor = tetrimino.borderColor;
        this.borderColorAlternate = tetrimino.borderColorAlternate;
    };

    // I Tetrimino
    Tetris.I = function () { };
    Tetris.I.prototype = new Tetris.Tetrimino('#15C1FF', '#139DDE', '#09709D', '#337992');

    Tetris.I.prototype.init = function () {
        this.cords[0] = [3, 2];
        this.cords[1] = [4, 2];
        this.cords[2] = [5, 2];
        this.cords[3] = [6, 2];

        this.constructor.prototype.init.call(this);
    };

    Tetris.I.prototype.rotate = function () {
        var tiles = Tetris.grid.tiles,
            cords = this.cords,
            isEmpty = Tetris.utils.isEmpty;

        switch (this.direction) {
            case Tetris.Directions.NORTH:

                if (!isEmpty([cords[0][0] + 1, cords[0][1] + 1])) break;
                if (!isEmpty([cords[2][0] - 1, cords[2][1] - 1])) break;
                if (!isEmpty([cords[3][0] - 2, cords[3][1] - 2])) break;

                tiles[cords[0][0] + 1][cords[0][1] + 1] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[2][0] - 1][cords[2][1] - 1] = tiles[cords[2][0]][cords[2][1]];
                tiles[cords[3][0] - 2][cords[3][1] - 2] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[0][0]][cords[0][1]] = null;
                tiles[cords[2][0]][cords[2][1]] = null;
                tiles[cords[3][0]][cords[3][1]] = null;

                cords[0] = [cords[0][0] + 1, cords[0][1] + 1];
                cords[2] = [cords[2][0] - 1, cords[2][1] - 1];
                cords[3] = [cords[3][0] - 2, cords[3][1] - 2];

                this.direction = Tetris.Directions.EAST;
                break;

            case Tetris.Directions.EAST:

                if (!isEmpty([cords[0][0] - 1, cords[0][1] - 1])) break;
                if (!isEmpty([cords[2][0] + 1, cords[2][1] + 1])) break;
                if (!isEmpty([cords[3][0] + 2, cords[3][1] + 2])) break;

                tiles[cords[0][0] - 1][cords[0][1] - 1] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[2][0] + 1][cords[2][1] + 1] = tiles[cords[2][0]][cords[2][1]];
                tiles[cords[3][0] + 2][cords[3][1] + 2] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[0][0]][cords[0][1]] = null;
                tiles[cords[2][0]][cords[2][1]] = null;
                tiles[cords[3][0]][cords[3][1]] = null;

                cords[0] = [cords[0][0] - 1, cords[0][1] - 1];
                cords[2] = [cords[2][0] + 1, cords[2][1] + 1];
                cords[3] = [cords[3][0] + 2, cords[3][1] + 2];

                this.direction = Tetris.Directions.NORTH;
                break;
        }

        Tetris.draw();
    };

    // J Tetrimino
    Tetris.J = function () { };
    Tetris.J.prototype = new Tetris.Tetrimino('#2E67F6', '#253EBD', '#14318F', '#1D4FB0');
    Tetris.J.prototype.init = function () {
        this.cords[0] = [3, 2];
        this.cords[1] = [4, 2];
        this.cords[2] = [5, 2];
        this.cords[3] = [5, 3];

        this.direction = Tetris.Directions.WEST;
        this.constructor.prototype.init.call(this);
    };

    Tetris.J.prototype.rotate = function () {
        var tiles = Tetris.grid.tiles,
            cords = this.cords,
            isEmpty = Tetris.utils.isEmpty;

        switch (this.direction) {
            case Tetris.Directions.NORTH:

                if (!isEmpty([cords[0][0] + 1, cords[0][1] + 1])) break;
                if (!isEmpty([cords[2][0] - 1, cords[2][1] - 1])) break;
                if (!isEmpty([cords[3][0], cords[3][1] - 2])) break;

                tiles[cords[0][0] + 1][cords[0][1] + 1] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[2][0] - 1][cords[2][1] - 1] = tiles[cords[2][0]][cords[2][1]];
                tiles[cords[3][0]][cords[3][1] - 2] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[0][0]][cords[0][1]] = null;
                tiles[cords[2][0]][cords[2][1]] = null;
                tiles[cords[3][0]][cords[3][1]] = null;

                cords[0] = [cords[0][0] + 1, cords[0][1] + 1];
                cords[2] = [cords[2][0] - 1, cords[2][1] - 1];
                cords[3] = [cords[3][0], cords[3][1] - 2];

                this.direction = Tetris.Directions.EAST;
                break;

            case Tetris.Directions.EAST:

                if (!isEmpty([cords[0][0] - 1, cords[0][1] + 1])) break;
                if (!isEmpty([cords[2][0] + 1, cords[2][1] - 1])) break;
                if (!isEmpty([cords[3][0] + 2, cords[3][1]])) break;

                tiles[cords[0][0] - 1][cords[0][1] + 1] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[2][0] + 1][cords[2][1] - 1] = tiles[cords[2][0]][cords[2][1]];
                tiles[cords[3][0] + 2][cords[3][1]] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[0][0]][cords[0][1]] = null;
                tiles[cords[2][0]][cords[2][1]] = null;
                tiles[cords[3][0]][cords[3][1]] = null;

                cords[0] = [cords[0][0] - 1, cords[0][1] + 1];
                cords[2] = [cords[2][0] + 1, cords[2][1] - 1];
                cords[3] = [cords[3][0] + 2, cords[3][1]];

                this.direction = Tetris.Directions.SOUTH;
                break;

            case Tetris.Directions.SOUTH:

                if (!isEmpty([cords[0][0] - 1, cords[0][1] - 1])) break;
                if (!isEmpty([cords[2][0] + 1, cords[2][1] + 1])) break;
                if (!isEmpty([cords[3][0], cords[3][1] + 2])) break;

                tiles[cords[0][0] - 1][cords[0][1] - 1] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[2][0] + 1][cords[2][1] + 1] = tiles[cords[2][0]][cords[2][1]];
                tiles[cords[3][0]][cords[3][1] + 2] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[0][0]][cords[0][1]] = null;
                tiles[cords[2][0]][cords[2][1]] = null;
                tiles[cords[3][0]][cords[3][1]] = null;

                cords[0] = [cords[0][0] - 1, cords[0][1] - 1];
                cords[2] = [cords[2][0] + 1, cords[2][1] + 1];
                cords[3] = [cords[3][0], cords[3][1] + 2];

                this.direction = Tetris.Directions.WEST;
                break;

            case Tetris.Directions.WEST:

                if (!isEmpty([cords[0][0] + 1, cords[0][1] - 1])) break;
                if (!isEmpty([cords[2][0] - 1, cords[2][1] + 1])) break;
                if (!isEmpty([cords[3][0] - 2, cords[3][1]])) break;

                tiles[cords[0][0] + 1][cords[0][1] - 1] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[2][0] - 1][cords[2][1] + 1] = tiles[cords[2][0]][cords[2][1]];
                tiles[cords[3][0] - 2][cords[3][1]] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[0][0]][cords[0][1]] = null;
                tiles[cords[2][0]][cords[2][1]] = null;
                tiles[cords[3][0]][cords[3][1]] = null;

                cords[0] = [cords[0][0] + 1, cords[0][1] - 1];
                cords[2] = [cords[2][0] - 1, cords[2][1] + 1];
                cords[3] = [cords[3][0] - 2, cords[3][1]];

                this.direction = Tetris.Directions.NORTH;
                break;
        }

        Tetris.draw();
    };

    // L Tetrimino
    Tetris.L = function () { };
    Tetris.L.prototype = new Tetris.Tetrimino('#FE8C19', '#E55703', '#C14602', '#B24526');
    Tetris.L.prototype.init = function () {
        this.cords[0] = [3, 3];
        this.cords[1] = [4, 3];
        this.cords[2] = [5, 3];
        this.cords[3] = [5, 2];

        this.direction = Tetris.Directions.WEST;
        this.constructor.prototype.init.call(this);
    };

    Tetris.L.prototype.rotate = function () {
        var tiles = Tetris.grid.tiles,
            cords = this.cords,
            isEmpty = Tetris.utils.isEmpty;

        switch (this.direction) {
            case Tetris.Directions.NORTH:

                if (!isEmpty([cords[0][0] + 1, cords[0][1] + 1])) break;
                if (!isEmpty([cords[2][0] - 1, cords[2][1] - 1])) break;
                if (!isEmpty([cords[3][0] - 2, cords[3][1]])) break;

                tiles[cords[0][0] + 1][cords[0][1] + 1] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[2][0] - 1][cords[2][1] - 1] = tiles[cords[2][0]][cords[2][1]];
                tiles[cords[3][0] - 2][cords[3][1]] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[0][0]][cords[0][1]] = null;
                tiles[cords[2][0]][cords[2][1]] = null;
                tiles[cords[3][0]][cords[3][1]] = null;

                cords[0] = [cords[0][0] + 1, cords[0][1] + 1];
                cords[2] = [cords[2][0] - 1, cords[2][1] - 1];
                cords[3] = [cords[3][0] - 2, cords[3][1]];

                this.direction = Tetris.Directions.EAST;
                break;

            case Tetris.Directions.EAST:

                if (!isEmpty([cords[0][0] - 1, cords[0][1] + 1])) break;
                if (!isEmpty([cords[2][0] + 1, cords[2][1] - 1])) break;
                if (!isEmpty([cords[3][0], cords[3][1] - 2])) break;

                tiles[cords[0][0] - 1][cords[0][1] + 1] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[2][0] + 1][cords[2][1] - 1] = tiles[cords[2][0]][cords[2][1]];
                tiles[cords[3][0]][cords[3][1] - 2] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[0][0]][cords[0][1]] = null;
                tiles[cords[2][0]][cords[2][1]] = null;
                tiles[cords[3][0]][cords[3][1]] = null;

                cords[0] = [cords[0][0] - 1, cords[0][1] + 1];
                cords[2] = [cords[2][0] + 1, cords[2][1] - 1];
                cords[3] = [cords[3][0], cords[3][1] - 2];

                this.direction = Tetris.Directions.SOUTH;
                break;

            case Tetris.Directions.SOUTH:

                if (!isEmpty([cords[0][0] - 1, cords[0][1] - 1])) break;
                if (!isEmpty([cords[2][0] + 1, cords[2][1] + 1])) break;
                if (!isEmpty([cords[3][0] + 2, cords[3][1]])) break;

                tiles[cords[0][0] - 1][cords[0][1] - 1] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[2][0] + 1][cords[2][1] + 1] = tiles[cords[2][0]][cords[2][1]];
                tiles[cords[3][0] + 2][cords[3][1]] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[0][0]][cords[0][1]] = null;
                tiles[cords[2][0]][cords[2][1]] = null;
                tiles[cords[3][0]][cords[3][1]] = null;

                cords[0] = [cords[0][0] - 1, cords[0][1] - 1];
                cords[2] = [cords[2][0] + 1, cords[2][1] + 1];
                cords[3] = [cords[3][0] + 2, cords[3][1]];

                this.direction = Tetris.Directions.WEST;
                break;

            case Tetris.Directions.WEST:

                if (!isEmpty([cords[0][0] + 1, cords[0][1] - 1])) break;
                if (!isEmpty([cords[2][0] - 1, cords[2][1] + 1])) break;
                if (!isEmpty([cords[3][0], cords[3][1] + 2])) break;

                tiles[cords[0][0] + 1][cords[0][1] - 1] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[2][0] - 1][cords[2][1] + 1] = tiles[cords[2][0]][cords[2][1]];
                tiles[cords[3][0]][cords[3][1] + 2] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[0][0]][cords[0][1]] = null;
                tiles[cords[2][0]][cords[2][1]] = null;
                tiles[cords[3][0]][cords[3][1]] = null;

                cords[0] = [cords[0][0] + 1, cords[0][1] - 1];
                cords[2] = [cords[2][0] - 1, cords[2][1] + 1];
                cords[3] = [cords[3][0], cords[3][1] + 2];

                this.direction = Tetris.Directions.NORTH;
                break;
        }

        Tetris.draw();
    };

    Tetris.O = function () { };
    Tetris.O.prototype = new Tetris.Tetrimino('#FFCA32', '#E29C00', '#BB7600', '#E2BC33');
    Tetris.O.prototype.init = function () {
        this.cords[0] = [4, 2];
        this.cords[1] = [4, 3];
        this.cords[2] = [5, 2];
        this.cords[3] = [5, 3];

        this.constructor.prototype.init.call(this);
    };

    Tetris.S = function () { };
    Tetris.S.prototype = new Tetris.Tetrimino('#78DE18', '#59B103', '#337B0D', '#337B0D');
    Tetris.S.prototype.init = function () {
        this.cords[0] = [5, 2];
        this.cords[1] = [4, 2];
        this.cords[2] = [4, 3];
        this.cords[3] = [3, 3];

        this.direction = Tetris.Directions.WEST;
        this.constructor.prototype.init.call(this);
    };

    Tetris.S.prototype.rotate = function () {
        var tiles = Tetris.grid.tiles,
            cords = this.cords,
            isEmpty = Tetris.utils.isEmpty;

        switch (this.direction) {

            case Tetris.Directions.NORTH:

                if (!isEmpty([cords[0][0] + 2, cords[0][1]])) break;

                tiles[cords[0][0] + 2][cords[0][1]] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[1][0] + 1][cords[1][1] - 1] = tiles[cords[1][0]][cords[1][1]];
                tiles[cords[3][0] - 1][cords[3][1] - 1] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[0][0]][cords[0][1]] = null;
                tiles[cords[3][0]][cords[3][1]] = null;

                cords[0] = [cords[0][0] + 2, cords[0][1]];
                cords[1] = [cords[1][0] + 1, cords[1][1] - 1];
                cords[3] = [cords[3][0] - 1, cords[3][1] - 1];

                this.direction = Tetris.Directions.WEST;
                break;

            case Tetris.Directions.WEST:

                if (!isEmpty([cords[0][0] - 2, cords[0][1]])) break;

                tiles[cords[0][0] - 2][cords[0][1]] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[1][0] - 1][cords[1][1] + 1] = tiles[cords[1][0]][cords[1][1]];
                tiles[cords[3][0] + 1][cords[3][1] + 1] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[0][0]][cords[0][1]] = null;
                tiles[cords[1][0]][cords[1][1]] = null;

                cords[0] = [cords[0][0] - 2, cords[0][1]];
                cords[1] = [cords[1][0] - 1, cords[1][1] + 1];
                cords[3] = [cords[3][0] + 1, cords[3][1] + 1];

                this.direction = Tetris.Directions.NORTH;
                break;
        }

        Tetris.draw();
    };

    Tetris.T = function () { };
    Tetris.T.prototype = new Tetris.Tetrimino('#D639AE', '#B22C83', '#9A1A91', '#9A1A91');
    Tetris.T.prototype.init = function () {
        this.cords[0] = [3, 2];
        this.cords[1] = [4, 2];
        this.cords[2] = [4, 3];
        this.cords[3] = [5, 2];

        this.direction = Tetris.Directions.WEST;
        this.constructor.prototype.init.call(this);
    };

    Tetris.T.prototype.rotate = function () {
        var tiles = Tetris.grid.tiles,
            cords = this.cords,
            isEmpty = Tetris.utils.isEmpty;

        switch (this.direction) {
            case Tetris.Directions.NORTH:

                if (!isEmpty([cords[0][0] + 1, cords[0][1] + 1])) break;

                tiles[cords[0][0] + 1][cords[0][1] + 1] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[2][0] + 1][cords[2][1] - 1] = tiles[cords[2][0]][cords[2][1]];
                tiles[cords[3][0] - 1][cords[3][1] - 1] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[3][0]][cords[3][1]] = null;

                cords[0] = [cords[0][0] + 1, cords[0][1] + 1];
                cords[2] = [cords[2][0] + 1, cords[2][1] - 1];
                cords[3] = [cords[3][0] - 1, cords[3][1] - 1];

                this.direction = Tetris.Directions.EAST;
                break;

            case Tetris.Directions.EAST:

                if (!isEmpty([cords[0][0] - 1, cords[0][1] + 1])) break;

                tiles[cords[0][0] - 1][cords[0][1] + 1] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[2][0] + 1][cords[2][1] + 1] = tiles[cords[2][0]][cords[2][1]];
                tiles[cords[3][0] + 1][cords[3][1] - 1] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[3][0]][cords[3][1]] = null;

                cords[0] = [cords[0][0] - 1, cords[0][1] + 1];
                cords[2] = [cords[2][0] + 1, cords[2][1] + 1];
                cords[3] = [cords[3][0] + 1, cords[3][1] - 1];

                this.direction = Tetris.Directions.SOUTH;
                break;

            case Tetris.Directions.SOUTH:

                if (!isEmpty([cords[0][0] - 1, cords[0][1] - 1])) break;

                tiles[cords[0][0] - 1][cords[0][1] - 1] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[2][0] - 1][cords[2][1] + 1] = tiles[cords[2][0]][cords[2][1]];
                tiles[cords[3][0] + 1][cords[3][1] + 1] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[3][0]][cords[3][1]] = null;

                cords[0] = [cords[0][0] - 1, cords[0][1] - 1];
                cords[2] = [cords[2][0] - 1, cords[2][1] + 1];
                cords[3] = [cords[3][0] + 1, cords[3][1] + 1];

                this.direction = Tetris.Directions.WEST;
                break;

            case Tetris.Directions.WEST:

                if (!isEmpty([cords[0][0] + 1, cords[0][1] - 1])) break;

                tiles[cords[0][0] + 1][cords[0][1] - 1] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[2][0] - 1][cords[2][1] - 1] = tiles[cords[2][0]][cords[2][1]];
                tiles[cords[3][0] - 1][cords[3][1] + 1] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[3][0]][cords[3][1]] = null;

                cords[0] = [cords[0][0] + 1, cords[0][1] - 1];
                cords[2] = [cords[2][0] - 1, cords[2][1] - 1];
                cords[3] = [cords[3][0] - 1, cords[3][1] + 1];

                this.direction = Tetris.Directions.NORTH;
                break;
        }

        Tetris.draw();
    };

    Tetris.Z = function () { };
    Tetris.Z.prototype = new Tetris.Tetrimino('#F83C5D', '#D61335', '#B8011D', '#B8011D');
    Tetris.Z.prototype.init = function () {
        this.cords[0] = [3, 2];
        this.cords[1] = [4, 2];
        this.cords[2] = [4, 3];
        this.cords[3] = [5, 3];

        this.direction = Tetris.Directions.WEST;
        this.constructor.prototype.init.call(this);
    };

    Tetris.Z.prototype.rotate = function () {
        var tiles = Tetris.grid.tiles,
            cords = this.cords,
            isEmpty = Tetris.utils.isEmpty;

        switch (this.direction) {
            case Tetris.Directions.NORTH:

                if (!isEmpty([cords[0][0] - 2, cords[0][1]])) break;

                tiles[cords[0][0] - 2][cords[0][1]] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[1][0] - 1][cords[1][1] - 1] = tiles[cords[1][0]][cords[1][1]];
                tiles[cords[3][0] + 1][cords[3][1] - 1] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[0][0]][cords[0][1]] = null;
                tiles[cords[3][0]][cords[3][1]] = null;

                cords[0] = [cords[0][0] - 2, cords[0][1]];
                cords[1] = [cords[1][0] - 1, cords[1][1] - 1];
                cords[3] = [cords[3][0] + 1, cords[3][1] - 1];

                this.direction = Tetris.Directions.WEST;
                break;

            case Tetris.Directions.WEST:

                if (!isEmpty([cords[0][0] + 2, cords[0][1]])) break;

                tiles[cords[0][0] + 2][cords[0][1]] = tiles[cords[0][0]][cords[0][1]];
                tiles[cords[1][0] + 1][cords[1][1] + 1] = tiles[cords[1][0]][cords[1][1]];
                tiles[cords[3][0] - 1][cords[3][1] + 1] = tiles[cords[3][0]][cords[3][1]];

                tiles[cords[0][0]][cords[0][1]] = null;
                tiles[cords[1][0]][cords[1][1]] = null;

                cords[0] = [cords[0][0] + 2, cords[0][1]];
                cords[1] = [cords[1][0] + 1, cords[1][1] + 1];
                cords[3] = [cords[3][0] - 1, cords[3][1] + 1];

                this.direction = Tetris.Directions.NORTH;
                break;
        }

        Tetris.draw();
    };
})(this);