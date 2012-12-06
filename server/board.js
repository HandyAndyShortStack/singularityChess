function Board() {
    
    // makes it possible to refer to this within nested functions
    // self is only used here when absolutely necessary
    var self = this;
    
    // needed primarily for mathmatic operations in ajacency checks later
    var fileNumberDict = {a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7};
    
    // a dictionary of squares, and a Square object type to fill it
    // these will be extended later to include basic piece ranges
    function Square(file, rank) {
        
        this.file = file;
        this.rank = rank;
        this.id = file + rank;
        this.fileNumber = fileNumberDict[file];
        
        function isEven(number) {
            var half = number / 2;
            return half === Math.floor(half);
        }
        if (isEven(this.fileNumber + rank)) {
            this.color = 'white';
        } else {
            this.color = 'black';
        }
    }
    
    // the primary reference for squares
    // this is populated by defining each file
    function makeFile(name, rankNames) {
        for (var i = 0; i < rankNames.length; i += 1) {
            var square = new Square(name, rankNames[i]);
            self[square.id] = square;
        }
    }
    makeFile('a', [-5, -4, 3, 4, 5]);
    makeFile('b', [-5, -4, -3, 2, 3, 4, 5]);
    makeFile('c', [-5, -4, -3, -2, 1, 2, 3, 4, 5]);
    makeFile('d', [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]);
    makeFile('e', [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]);
    makeFile('f', [-5, -4, -3, -2, 1, 2, 3, 4, 5]);
    makeFile('g', [-5, -4, -3, 2, 3, 4, 5]);
    makeFile('h', [-5, -4, 3, 4, 5]);
    
    // in order to add basic piece movement information to the square objects,
    // we will need to define certain kinds of ajacency and alignment.
    // this process will necessarily include several explicit special cases
    // due to the funky geometry of the board.
    // test everything relying on these functions thoroughly!
    
    function areDirectlyAjacent(square1, square2) {
        if (
            square1.file + -square1.rank in self &&
            square2.file + -square2.rank in self &&
            Math.abs(square1.rank - square2.rank) > 1
           ) {   
            return false;
        }
        var difference = square1.fileNumber + Math.abs(square1.rank) -
                         square2.fileNumber - Math.abs(square2.rank);
        if (
            Math.abs(difference) === 1 &&
            Math.abs(Math.abs(square1.fileNumber) -
            Math.abs(square2.fileNumber)) < 2 &&
            Math.abs(Math.abs(square1.rank) -
            Math.abs(square2.rank)) < 2
           ) {
            return true;
        }
        return false;
    };
    
    
    function areDiagonallyAjacent(square1, square2) {
        if (square1.id === square2.id) {
            return false;
        } else if (
                   square1.id === 'e0' && square2.id === 'd0' ||
                   square1.id === 'd0' && square2.id === 'e0' ||
                   square1.id === 'a4' && square2.id === 'a-4' ||
                   square1.id === 'a-4' && square2.id === 'a4' ||
                   square1.id === 'h4' && square2.id === 'h-4' ||
                   square1.id === 'h-4' && square2.id === 'h4'
                  ) {
            return true;
        }
        var neighbors = 0;
        for (var squareId in self) {
            var middleSquare = self[squareId];
            if (
                areDirectlyAjacent(middleSquare, square1) &&
                areDirectlyAjacent(middleSquare, square2)
               ) {
                neighbors += 1;
            }
        }
        if (neighbors === 2) {
            return true;
        }
        return false;
    };
    
    // order of arguments matters here
    // square2 must be the middle square
    function areDirectlyAligned(square1, square2, square3) {
        if (
            square1.id === square2.id ||
            square1.id === square3.id ||
            square2.id === square3.id
           ) {
            return false;
        } else if (
                   square2.id === 'e0' && square1.id === 'd0' && square3.id === 'e1' ||
                   square2.id === 'e0' && square1.id === 'e1' && square3.id === 'd0' ||
                   square2.id === 'e0' && square1.id === 'd0' && square3.id === 'e-1' ||
                   square2.id === 'e0' && square1.id === 'e-1' && square3.id === 'd0' ||
                   square2.id === 'd0' && square1.id === 'e0' && square3.id === 'd1' ||
                   square2.id === 'd0' && square1.id === 'd1' && square3.id === 'e0' ||
                   square2.id === 'd0' && square1.id === 'e0' && square3.id === 'd-1' ||
                   square2.id === 'd0' && square1.id === 'd-1' && square3.id === 'e0'
                  ) {
            return true;
        } else if (
                   areDirectlyAjacent(square1, square2) &&
                   areDirectlyAjacent(square2, square3) &&
                   !areDiagonallyAjacent(square1, square3)
                  ) {
            return true;
        }
        return false;
    };
    
    // once again, order of arguments matters here
    // square2 must be the middle square
    function areDiagonallyAligned(square1, square2, square3) {
        if (
            square1.id === square2.id ||
            square1.id === square3.id ||
            square2.id === square3.id
           ) {
            return false;
        } else if (square2.id === 'd0') {
            if (
                square1.id === 'e1' && square3.id === 'e-1' ||
                square1.id === 'e-1' && square3.id === 'e1' ||
                square1.id === 'e0' && square3.id === 'c1' ||
                square1.id === 'c1' && square3.id === 'e0'
               ) {
                return true;
            } else {
                return false;
            }
        } else if (square2.id === 'e0') {
            if (
                square1.id === 'd1' && square3.id === 'd-1' ||
                square1.id === 'd-1' && square3.id === 'd1' ||
                square1.id === 'd0' && square3.id === 'f1' ||
                square1.id === 'f1' && square3.id === 'd0'
               ) {
                return true;
            } else {
                return false;
            }
        } else if (
                   areDiagonallyAjacent(square1, square2) &&
                   areDiagonallyAjacent(square2, square3)
                  ) {
            for (var squareId in self) {
                if (
                    areDirectlyAjacent(square1, self[squareId]) &&
                    areDirectlyAjacent(square3, self[squareId])
                   ) {
                    return false;
                }
            }
            return true;
        }
        return false;
    };
    
    function areKnightAjacent(square1, square2) {
        if (
            square1.id !== square2.id &&
            !areDirectlyAjacent(square1, square2) &&
            !areDiagonallyAjacent(square1, square2)
           ) {
            for (var squareId in self) {
                if (
                    areDiagonallyAjacent(square2, self[squareId]) &&
                    areDirectlyAjacent(square1, self[squareId])
                   ) {
                    return true;
                }
            }
        }
        return false;
    };
    
    // now each square in this gets properties defining the maximum
    // range of movement for each piece type originating from that square.
    // inherant differences in the way the various pieces move prevent
    // consistancy in the structure of this data across piece types.
    
    for (var squareId in this) {
        
        var square = this[squareId];
        
        // first, the maximum rook ranges
        square.rookRanges = [];
        for (var squareId in this) {
            if (areDirectlyAjacent(square, this[squareId])) {
                square.rookRanges.push([squareId]);
            }
        }
        // recursively adds squares to a rook movement ray
        function addSquaresToRookRange(range) {
            
            var rangeSquare1 = self[range[range.length - 2]] || square;
            var rangeSquare2 = self[range[range.length - 1]];
            
            for (var squareId in self) {
            
                var candidate = self[squareId];
                
                // a little extra code is used here to specify which
                // direction rooks enter and leave d0 and e0
                if (
                    areDirectlyAligned(rangeSquare1, rangeSquare2, candidate) &&
                    !((square.file === 'd' && candidate.file === 'e' ||
                       square.file === 'e' && candidate.file === 'd') &&
                      (square.rank > 0 && candidate.rank < 0 || 
                       square.rank < 0 && candidate.rank > 0)) &&
                    square.id !== squareId
                   ) {
                    range.push(squareId);
                    addSquaresToRookRange(range);
                    break;
                }
            }
        }
        for (var i = 0; i < square.rookRanges.length; i += 1) {
            addSquaresToRookRange(square.rookRanges[i]);
        }
        
        // next, the maximum bishop ranges
        square.bishopRanges = [];
        for (var squareId in this) {
            if (areDiagonallyAjacent(square, this[squareId])) {
                square.bishopRanges.push([squareId]);
            }
        }
        // recursively adds squares to a bishop movement ray
        function addSquaresToBishopRange(range) {
            
            var rangeSquare1 = self[range[range.length - 2]] || square;
            var rangeSquare2 = self[range[range.length - 1]];
            
            for (var squareId in self) {
            
                var candidate = self[squareId];
                
                if (
                    areDiagonallyAligned(rangeSquare1, rangeSquare2, candidate) &&
                    square.id !== squareId
                   ) {
                    range.push(squareId);
                    addSquaresToBishopRange(range);
                    break;
                }
            }
        }
        for (var i = 0; i < square.bishopRanges.length; i += 1) {
            addSquaresToBishopRange(square.bishopRanges[i]);
        }
        
        // now the knight range. it is a single list, unlike the rook and 
        // bishop ranges.
        square.knightRange = []
        for (var squareId in this) {
            if (areKnightAjacent(square, this[squareId])) {
                square.knightRange.push(squareId);
            }
        }
        
        // queen ranges are simple
        square.queenRanges = [].concat(square.rookRanges, square.bishopRanges);
        
        // king ranges are faster to fetch as the first square of each
        // queen range than by iterating over the whole bord several times.
        square.kingRange = [];
        for (var i = 0; i < square.queenRanges.length; i += 1) {
            square.kingRange.push(square.queenRanges[i][0]);
        }
        
        // pawns are the most problematic piece. here we will define the
        // maximum range of movement possible separately for each color.
        square.pawnRanges = {white: [], black: []};
        // this loop adds one square of movement along the pawn's file
        for (var squareId in this) {
            var candidate = this[squareId];
            if (
                candidate.file === square.file &&
                areDirectlyAjacent(square, candidate)
               ) {
                if (candidate.rank < square.rank) {
                    square.pawnRanges.white.push(squareId);
                } else {
                    square.pawnRanges.black.push(squareId);
                }
            }
        }
        // these are used in a couple of things directly below
        var whiteMiddleSquare = this[square.pawnRanges.white[0]];
        var blackMiddleSquare = this[square.pawnRanges.black[0]];
        // now we add an extra square of range along the file if the pawn
        // is on its starting square
        if (square.rank === 4) {
            for (var squareId in this) {
                var candidate = this[squareId];
                if (
                    squareId !== square.id &&
                    square.file === candidate.file &&
                    areDirectlyAjacent(whiteMiddleSquare, candidate)
                   ) {
                    square.pawnRanges.white.push(squareId);
                }
            }
        }
        // yes, I am repeating myself. deal with it.
        if (square.rank === -4) {
            for (var squareId in this) {
                var candidate = this[squareId];
                if (
                    squareId !== square.id &&
                    square.file === candidate.file &&
                    areDirectlyAjacent(blackMiddleSquare, candidate)
                   ) {
                    square.pawnRanges.black.push(squareId);
                }
            }
        }
        // now to add the attacking squares
        for (var squareId in this) {
            var candidate = this[squareId];
            if (areDiagonallyAjacent(candidate, square)) {
                if (
                    whiteMiddleSquare &&
                    square.pawnRanges.white.indexOf(squareId) === -1 &&
                    areDirectlyAjacent(candidate, whiteMiddleSquare)
                   ) {
                    square.pawnRanges.white.push(squareId);
                } else if (
                           blackMiddleSquare &&
                           square.pawnRanges.black.indexOf(squareId) === -1 &&
                           areDirectlyAjacent(candidate, blackMiddleSquare)
                          ) {
                    square.pawnRanges.black.push(squareId);
                }
            }
        }
    }
    // CRAPPY BUG FIX:
    this['b2'].pawnRanges.black.push('a3');
    this['c1'].pawnRanges.black.push('b2');
    this['d0'].pawnRanges.black.push('c1');
    this['e0'].pawnRanges.black.push('f1');
    this['f1'].pawnRanges.black.push('g2');
    this['g2'].pawnRanges.black.push('h3');
}

// serve a board object in a collection called 'board'
// making a new board object takes about a minute, so only
// make a new one if there is not exactly one in the collection
var board = new Meteor.Collection('board');
Meteor.publish('board', function() {
    return board.find();
});
if (board.find().fetch().length !== 1) {
    board.remove({});
    board.insert(new Board());
}
