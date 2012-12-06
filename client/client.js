Meteor.startup(function() {
///////////////////////////

// get the board object from the server
// and instantiate game objects once it loads
boardPublication = new Meteor.Collection('board');
Meteor.subscribe('board');
var cursor = boardPublication.find();
var observer = cursor.observe({
    added: function() {
        board = boardPublication.find().fetch()[0];
        delete board._id
        chessSet = new ChessSet(board);
        game = new Game(board, chessSet);
        svgBoard = new SVGBoard(board, chessSet, game);
        observer.stop();
    }
});

// contains constructors for all the various piece types
// all information regarding the pieces are stored in their objects,
// including maximum movement ranges
function ChessSet(board) {
    
    // sigh
    var self = this;
    
    this.Rook = function(color, location, hasMoved) {
        
        this.color = color;
        this.location = location;
        this.pieceType = 'Rook';
        if (typeof(hasMoved) === 'undefined') {
            hasMoved = true;
        } else {
            hasMoved = false;
        }
        this.hasMoved = hasMoved;
        
        var square = board[location];
        
        this.range = function(position) {
            
            var range = [];
            
            for (var i = 0; i < square.rookRanges.length; i += 1) {
                var rookRange = square.rookRanges[i];
                for (var i2 = 0; i2 < square.rookRanges[i].length; i2 += 1) {
                    var candidateId = rookRange[i2];
                    if (candidateId in position) {
                        if (position[candidateId].color !== color) {
                            range.push(candidateId);
                        }
                        break;
                    }
                    range.push(candidateId);
                }
            }
            return range;
        };
    };
    
    this.Bishop = function(color, location) {
        
        this.color = color;
        this.location = location
        this.pieceType = 'Bishop';
        
        var square = board[location];
        
        // the bishop version of this function is almost identical to the
        // rook, but it has to omit duplicate entries when bishop rays
        // cross each other
        this.range = function(position) {
            
            var range = [];
            
            for (var i = 0; i < square.bishopRanges.length; i += 1) {
                var bishopRange = square.bishopRanges[i];
                for (var i2 = 0; i2 < bishopRange.length; i2 += 1) {
                    var candidateId = bishopRange[i2];
                    if (candidateId in position) {
                        if (
                            position[candidateId].color !== color &&
                            range.indexOf(candidateId) === -1
                           ) {
                            range.push(candidateId);
                        }
                        break;
                    } else if (range.indexOf(candidateId) === -1) {
                        range.push(candidateId);
                    }
                }
            }
            return range;
        };
    };
    
    this.Knight = function(color, location) {
        
        this.color = color;
        this.location = location;
        this.pieceType = 'Knight';
        
        var square = board[location];
        
        this.range = function(position) {
            
            var range = [];
            
            for (var i = 0; i < square.knightRange.length; i += 1) {
                var candidateId = square.knightRange[i];
                if (
                    !(candidateId in position &&
                      position[candidateId].color === color)
                   ) {
                    range.push(candidateId);
                }
            }
            return range;
        };
    };
    
    this.Queen = function(color, location) {
        
        this.color = color;
        this.location = location;
        this.pieceType = 'Queen';
        
        var square = board[square];
        
        // why reinvent the wheel?
        this.range = function(position) {
            
            var range = [];
            var rookRange = new self.Rook(color, location).range(position);
            var bishopRange = new self.Bishop(color, location).range(position);
            var compositeRange = [].concat(rookRange, bishopRange);
            
            for (var i = 0; i < compositeRange.length; i += 1) {
                if (range.indexOf(compositeRange[i]) === -1) {
                    range.push(compositeRange[i]);
                }
            }
            return range;
        };
    };
    
    this.King = function(color, location, hasMoved) {
        
        this.color = color;
        this.location = location;
        this.pieceType = 'King';
        if (typeof(hasMoved) === 'undefined') {
            hasMoved = true;
        } else {
            hasMoved = false;
        }
        this.hasMoved = hasMoved;
        
        var square = board[location];
        
        this.range = function(position) {
            
            var range = [];
            
            for (var i = 0; i < square.kingRange.length; i += 1) {
                var candidateId = square.kingRange[i];
                if (
                    !(candidateId in position &&
                      position[candidateId].color === color)
                   ) {
                    range.push(candidateId);
                }
            }
            
            // castling
            // this considers castling to be a movement of the king
            // to the left or right by two squares
            if (hasMoved === false) {
                var shortRookSquareId = 'h' + square.rank;
                var longRookSquareId = 'a' + square.rank;
                var shortTargetSquareId = 'g' + square.rank;
                var longTargetSquareId = 'c' + square.rank;
                var shortMiddleSquareId = 'f' + square.rank;
                var kingLongMiddleSquareId = 'd' + square.rank;
                var rookLongMiddleSquareId = 'b' + square.rank;
                if (
                    shortRookSquareId in position &&
                    position[shortRookSquareId].color === color &&
                    position[shortRookSquareId].pieceType === 'Rook' &&
                    position[shortRookSquareId].hasMoved === false &&
                    !(shortTargetSquareId in position) &&
                    !(shortMiddleSquareId in position)
                   ) {
                    range.push(shortTargetSquareId);
                }
                if (
                    longRookSquareId in position &&
                    position[longRookSquareId].color === color &&
                    position[longRookSquareId].pieceType === 'Rook' &&
                    position[longRookSquareId].hasMoved === false &&
                    !(longTargetSquareId in position) &&
                    !(kingLongMiddleSquareId in position) &&
                    !(rookLongMiddleSquareId in position)
                   ) {
                    range.push(longTargetSquareId);
                }
                this.getRookTargetSquareId = function(targetSquareId) {
                    if (targetSquareId === shortTargetSquareId) {
                        return shortMiddleSquareId;
                    } else {
                        return longMiddleSquareId;
                    }
                };
                this.getRookStartSquareId = function(targetSquareId) {
                    if (targetSquareId === shortTargetSquareId) {
                        return shortRookSquareId;
                    } else {
                        return longRookSquareId;
                    }
                };
            }
            return range;
        };
        
    };
    
    this.Pawn = function(color, location, isVulnerableToEP) {
        
        this.color = color;
        this.location = location;
        this.pieceType = 'Pawn';
        if (typeof(isVulnerableToEP) === 'undefined') {
            isVulnerableToEP = false;
        } else {
            isVulnerableToEP = true;
        }
        this.isVulnerableToEP = isVulnerableToEP;
        
        this.getEPVulnerableSquareId = function() {
            if (color === 'white') {
                var originatingRank = 4;
            } else {
                var originatingRank = -4;
            }
            var originatingFile = board[location].file;
            var originatingSquareId = originatingFile + originatingRank;
            var originatingSquare = board[originatingSquareId];
            var vulnerableSquareId = originatingSquare.pawnRanges[color][0];
            var EPVulnerableSquareId = vulnerableSquareId;
            return EPVulnerableSquareId;
        };
        
        var square = board[location];
        
        // this function expects the first square in the relevant
        // board.pawnRanges array to be the square directly in front of
        // the pawn and the second square to be the double advance option
        // if the pawn is on its original square.
        this.range = function(position) {
            
            var range = [];
            var pawnRange = square.pawnRanges[color];
            
            for (var i = 0; i < pawnRange.length; i += 1) {
                var candidateId = pawnRange[i];
                var candidateSquare = board[candidateId];
                // these conditionals are a bit longer than absolutely
                // necessary, but are more readable for it
                // first, single advancement
                // CAUTION: other functions rely on single advancement being
                // the first entry in the range array!
                if (i === 0 && !(candidateId in position)) {
                    range.push(candidateId);
                // double advancement
                } else if (
                           i === 1 &&
                           Math.abs(square.rank) === 4 &&
                           candidateSquare.file === square.file &&
                           range.indexOf(pawnRange[0]) !== -1 &&
                           !(candidateId in position)
                          ) {
                    range.push(candidateId);
                // attacking
                } else if (
                           (candidateSquare.file !== square.file ||
                            Math.abs(candidateSquare.rank) ===
                            Math.abs(square.rank)) &&
                           candidateId in position &&
                           position[candidateId].color !== color
                          ) {
                    range.push(candidateId);
                }
            }
            
            // en passant
            for (var squareId in position) {
                if (
                    position[squareId].isVulnerableToEP &&
                    position[squareId].color !== color
                   ) {
                    for (var i = 0; i < pawnRange.length; i += 1) {
                        var candidateId = pawnRange[i];
                        if (
                            candidateId ===
                            position[squareId].getEPVulnerableSquareId() &&
                            pawnRange.indexOf(candidateId) !== -1
                           ) {
                            range.push(candidateId);
                        }
                    }
                }
            }
            return range;
        };
    };
}

// here is where the business happens
// everything dealing with moves is in here
// en passant, check, and castling are all in here as well
function Game(board, chessSet) {
    
    // set up a board in starting position
    // in the future it would be nice to edit the position 
    // in a structured manner. currently it is read only outside
    // the scope of the game object.
    var position = {
                    'a4': new chessSet.Pawn('white', 'a4'),
                    'b4': new chessSet.Pawn('white', 'b4'),
                    'c4': new chessSet.Pawn('white', 'c4'),
                    'd4': new chessSet.Pawn('white', 'd4'),
                    'e4': new chessSet.Pawn('white', 'e4'),
                    'f4': new chessSet.Pawn('white', 'f4'),
                    'g4': new chessSet.Pawn('white', 'g4'),
                    'h4': new chessSet.Pawn('white', 'h4'),
                    'a5': new chessSet.Rook('white', 'a5', false),
                    'b5': new chessSet.Knight('white', 'b5'),
                    'c5': new chessSet.Bishop('white', 'c5'),
                    'd5': new chessSet.Queen('white', 'd5'),
                    'e5': new chessSet.King('white', 'e5', false),
                    'f5': new chessSet.Bishop('white', 'f5'),
                    'g5': new chessSet.Knight('white', 'g5'),
                    'h5': new chessSet.Rook('white', 'h5', false),
                    'a-4': new chessSet.Pawn('black', 'a-4'),
                    'b-4': new chessSet.Pawn('black', 'b-4'),
                    'c-4': new chessSet.Pawn('black', 'c-4'),
                    'd-4': new chessSet.Pawn('black', 'd-4'),
                    'e-4': new chessSet.Pawn('black', 'e-4'),
                    'f-4': new chessSet.Pawn('black', 'f-4'),
                    'g-4': new chessSet.Pawn('black', 'g-4'),
                    'h-4': new chessSet.Pawn('black', 'h-4'),
                    'a-5': new chessSet.Rook('black', 'a-5', false),
                    'b-5': new chessSet.Knight('black', 'b-5'),
                    'c-5': new chessSet.Bishop('black', 'c-5'),
                    'd-5': new chessSet.Queen('black', 'd-5'),
                    'e-5': new chessSet.King('black', 'e-5', false),
                    'f-5': new chessSet.Bishop('black', 'f-5'),
                    'g-5': new chessSet.Knight('black', 'g-5'),
                    'h-5': new chessSet.Rook('black', 'h-5', false)
                   };
    
    var toMove = 'white'
    
    // check is calculated by finding the king, then checking all the
    // attacking ranges for each piece type radiating form the king's
    // square for corresponding enemy pieces.
    function isCheck(position, color) {
        
        for (var squareId in position) {
            if (
                position[squareId].color === color &&
                position[squareId].pieceType === 'King'
               ) {
                var kingSquareId = squareId;
                break;
            }
        }
        var rookRange = new chessSet.Rook(color, kingSquareId).range(position);
        var knightRange = new chessSet.Knight(color, kingSquareId).range(position);
        var bishopRange = new chessSet.Bishop(color, kingSquareId).range(position);
        var kingRange = new chessSet.King(color, kingSquareId).range(position);
        var pawnRange = new chessSet.Pawn(color, kingSquareId).range(position);
        for (var i = 0; i < rookRange.length; i += 1) {
            var squareId = rookRange[i];
            if (
                squareId in position &&
                (position[squareId].pieceType === 'Rook' ||
                 position[squareId].pieceType === 'Queen') &&
                position[squareId].color !== color
               ) {
                return true;
            }
        }
        for (var i = 0; i < knightRange.length; i += 1) {
            var squareId = knightRange[i];
            if (
                squareId in position &&
                position[squareId].pieceType === 'Knight' &&
                position[squareId].color !== color
               ) {
                return true;
            }
        }
        for (var i = 0; i < bishopRange.length; i += 1) {
            var squareId = bishopRange[i];
            if (
                squareId in position &&
                (position[squareId].pieceType === 'Bishop' ||
                 position[squareId].pieceType === 'Queen') &&
                position[squareId].color !== color
               ) {
                return true;
            }
        }
        for (var i = 0; i < kingRange.length; i += 1) {
            var squareId = kingRange[i];
            if (
                squareId in position &&
                position[squareId].pieceType === 'King' &&
                position[squareId].color !== color
               ) {
                return true;
            }
        }
        for (var i = 0; i < pawnRange.length; i += 1) {
            var squareId = pawnRange[i];
            if (
                squareId in position &&
                position[squareId].pieceType === 'Pawn' &&
                position[squareId].color !== color &&
                bishopRange.indexOf(squareId) !== -1
               ) {
                return true;
            }
        }
        return false;
    }
    
    // looks at all possible moves to see if there is at least one that
    // will result in a position that is not check
    function isCheckMate(position, color) {
        for (var squareId in position) {
            var piece = position[squareId];
            if (piece.color === color) {
                var range = piece.range(position);
                for (var i = 0; i < range.length; i += 1) {
                    var endSquareId = range[i];
                    var newPosition = {};
                    for (property in position) {
                        newPosition[property] = position[property];
                    }
                    var newPiece = new chessSet[piece.pieceType](color, endSquareId);
                    newPosition[endSquareId] = newPiece;
                    delete newPosition[squareId];
                    if (!isCheck(newPosition, color)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    // we will be generating a move list and populating it with
    // a specific object type
    var moveList = [];
    function MoveListEntry(startSquareId, endSquareId, position) {
        this.startSquareId = startSquareId;
        this.endSquareId = endSquareId;
        this.position = position;
        this.color = position[endSquareId].color;
    }
    
    // here is where the magic happens
    this.move = function(startSquareId, endSquareId, promotedPieceType) {
        
        // set default promotion to Queen
        if (typeof(promotedPieceType) === 'undefined') {
            promotedPieceType = 'Queen';
        }
        
        // first, a battery of simple legality checks
        if (!(startSquareId in board)) {
            throw new Error('illegal move: startSquareId not in board');
        } else if (!(endSquareId in board)) {
            throw new Error('illegal move: endSquareId not in board');
        } else if (!(startSquareId in position)) {
            throw new Error('illegal move: no piece on starting square');
        } else if (
                   position[startSquareId].range(position)
                   .indexOf(endSquareId) === -1
                  ) {
            throw new Error('illegal move: ending square not in piece range');
        } else if (position[startSquareId].color !== toMove) {
            throw new Error('illegal move: it is not ' +
                            position[startSquareId].color +
                            "'s move");
        } else if (
                   position[startSquareId].pieceType === 'King' &&
                   Math.abs(board[startSquareId].fileNumber -
                   board[endSquareId].fileNumber) > 1
                  ) {
            if (isCheck(position, toMove)) {
                throw new Error('illegal move: cannot castle out of check');
            }
            var newPosition = {};
            for (var property in position) {
                newPosition[property] = position[property];
            }
            var middleSquareId = position[startSquareId].getRookTargetSquareId(endSquareId);
            newPosition[middleSquareId] = new chessSet.King(toMove, middleSquareId);
            delete newPosition[startSquareId];
            if (isCheck(newPosition, toMove)) {
                throw new Error('illegal move: cannot castle through check');
            }
        }
        
        
        
        var piece = position[startSquareId];
        var newPiece = new chessSet[piece.pieceType](piece.color, endSquareId);
        
        var resultingPosition = {}
        for (var squareId in position) {
            resultingPosition[squareId] = position[squareId];
        }
        delete resultingPosition[startSquareId];
        resultingPosition[endSquareId] = newPiece;
        
        if (isCheck(resultingPosition, toMove)) {
            throw new Error('illegal move: ' + toMove + ' is in check');
        }
        
        // at this point, we are certain that the move is legal
        // now to deal with some en passant business
        for (var squareId in resultingPosition) {
            if (resultingPosition[squareId].isVulnerableToEP) {
                if (
                    endSquareId ===
                    resultingPosition[squareId].getEPVulnerableSquareId() &&
                    newPiece.pieceType === 'Pawn'
                   ) {
                    delete resultingPosition[squareId];
                } else {
                    resultingPosition[squareId].isVulnerableToEP = false;
                }
            }
        }
        if (
            newPiece.pieceType === 'Pawn' &&
            board[startSquareId].file === board[endSquareId].file &&
            Math.abs(Math.abs(board[startSquareId].rank) -
            Math.abs(board[endSquareId].rank)) !== 1
           ) {
            resultingPosition[endSquareId].isVulnerableToEP = true;
        }
        
        // move the rook when castling
        if (
            position[startSquareId].pieceType === 'King' &&
            Math.abs(board[startSquareId].fileNumber -
            board[endSquareId].fileNumber) > 1
           ) {
            var rookTargetSquareId = piece.getRookTargetSquareId(endSquareId);
            var rookStartSquareId = piece.getRookStartSquareId(endSquareId);
            var newRook = new chessSet.Rook(piece.color, rookTargetSquareId);
            resultingPosition[rookTargetSquareId] = newRook;
            delete resultingPosition[rookStartSquareId];
        }
        
        // pawn promotion
        if (
            piece.pieceType === 'Pawn' &&
            Math.abs(board[endSquareId].rank) === 5
           ) {
            newPiece = new chessSet[promotedPieceType](toMove, endSquareId);
            resultingPosition[endSquareId] = newPiece;
        }
        
        // make the changes official
        position = resultingPosition;
        
        moveList.push(new MoveListEntry(startSquareId, endSquareId, resultingPosition));
        
        // toggle toMove
        if (toMove === 'white') { toMove = 'black'; }
        else if (toMove === 'black') { toMove = 'white'; }
    }
    
    // exposed methods
    this.position = function() { return position; };
    this.toMove = function() { return toMove; };
    this.moveList = function() { return moveList; };
    this.isCheck = function(checkedPosition, color) {
        if (typeof(checkedPosition) === 'undefined') {
            return isCheck(position, toMove);
        } else {
            return isCheck(checkedPosition, color);
        }
    };
    this.isCheckMate = function() { return isCheckMate(position, toMove); };
}

// this object defines the board and the user interface
function SVGBoard(board, chessSet, game) {
    
    // everything scales to the board height,
    // so this value can be changed if needed
    var h = (95 / 100) * window.innerHeight || 450;
    var w = (8 / 12) * h;
    
    // the handle for the svg element
    svg = d3.select('body')
            .append('svg')
            .attr('id', 'board')
            .attr('height', h)
            .attr('width', w);
                
    var defs = svg.append('defs');
    
    function getCoordinates(squareId) {
        
        var square = board[squareId];
        
        var xPosition = (w / 8) * square.fileNumber;
        xPosition += w / 16;
    
        var xSide = Math.abs((w / 2) - xPosition);
        
        var hypotenuse = (Math.abs(square.rank) + 1) * (h / 12);
        hypotenuse -= h / 24;
        
        var ySide = Math.sqrt(Math.pow(hypotenuse, 2) - Math.pow(xSide, 2));
        if (isNaN(ySide)) { ySide = 0; }
        
        var yPosition;
        if (square.id.indexOf('-') !== -1) {
            yPosition = (h / 2) - ySide;
        } else {
            yPosition = (h / 2) + ySide;
        }
        
        return {x: xPosition, y: yPosition};
    };
        
    for (var squareId in board) {
        
        var square = board[squareId];
        
        if (square.color === 'white') {
            var color = 'beige';
        } else {
            var color = 'cadetblue';
        }
        
        var maskId = 'mask-' + square.id;
        var mask = defs.append('mask')
                       .attr('id', maskId);
                       
        mask.append('circle')
            .attr('cx', w / 2)
            .attr('cy', h / 2)
            .attr('r', (h / 12) * (Math.abs(square.rank) + 1))
            .attr('fill', 'white');
            
        if (Math.abs(square.rank) > 0) {
            mask.append('circle')
                .attr('cx', w / 2)
                .attr('cy', h / 2)
                .attr('r', (h / 12) * (Math.abs(square.rank)));
        }
        
        var clipId = 'clip-' + square.id;
        var clip = defs.append('clipPath')
                       .attr('id', clipId);
        
        clip.append('rect')
            .attr('x', (w / 8) * square.fileNumber)
            .attr('y', 0)
            .attr('width', w / 8)
            .attr('height', h);
        
        svg.append('circle')
           .attr('id', square.id)
           .attr('cx', w / 2)
           .attr('cy', h / 2)
           .attr('r', h / 2)
           .attr('fill', color)
           .attr('mask', 'url(#' + maskId + ')')
           .attr('clip-path', 'url(#' + clipId + ')');
    
    }
    
    // pieces will be represented graphically as utf characters
    var utfPieceDict = {
                        King: {
                               white: '\u2654',
                               black: '\u265A'
                              },
                        Queen: {
                                white: '\u2655',
                                black: '\u265B'
                               },
                        Rook: {
                               white: '\u2656',
                               black: '\u265C'
                              },
                        Bishop: {
                                 white: '\u2657',
                                 black: '\u265D'
                                },
                        Knight: {
                                 white: '\u2658',
                                 black: '\u265E'
                                },
                        Pawn: {
                               white: '\u2659',
                               black: '\u265F'
                              }
                       };
    
    function svgPiece(piece) {
        
        var utfString = utfPieceDict[piece.pieceType][piece.color];
        
        var square = board[piece.location];
        var coordinates = getCoordinates(piece.location);
        
        var yOffset = h * (13 / 500);
        
        return svg.append('text')
                  .attr('x', coordinates.x)
                  .attr('y', coordinates.y + yOffset)
                  .attr('text-anchor', 'middle')
                  .attr('font-size', h * (40 / 500) + 'px')
                  .text(utfString);
    }
    
    var pieces = {};
    var drawPosition = function() {
        for (var squareId in pieces) {
            pieces[squareId].remove(); 
            delete pieces[squareId];
        }
        for (var squareId in game.position()) {
            var piece = game.position()[squareId];
            pieces[squareId] = new svgPiece(piece);
        }
    
    }
    
    // these will be the interaction nodes for the user interface
    function Dot(squareId) {
        
        var coordinates = getCoordinates(squareId);
        
        return  svg.append('circle')
                   .attr('cx', coordinates.x)
                   .attr('cy', coordinates.y)
                   .attr('r', h * (17 /500))
                   .attr('opacity', 0)
                   .attr('fill', 'orange');
    }
    
    // these will be the only visible dots
    var indicatorDots = {};
    for (var squareId in board) {
        indicatorDots[squareId] = new Dot(squareId);
        
    }
    
    // the chessmen will need to be drawn above the indicator dots,
    // but below the pieceSelector and moveOption dots
    drawPosition();
    
    // these dots will move a piece on the originating square to
    // the target square when clicked
    var moveOptionDots = {};
    function moveOptionDot(originatingSquareId, targetSquareId) {
        
        var dot = new Dot(targetSquareId);
        
        // the most exciting function in this file
        function makeMove() {
            
            game.move(originatingSquareId, targetSquareId);
            
            // clean up all the dots
            for (var dotId in moveOptionDots) {
                moveOptionDots[dotId].remove();
                delete moveOptionDots[dotId];
            }
            for (var dotId in pieceSelectorDots) {
                pieceSelectorDots[dotId].remove();
                delete pieceSelectorDots[dotId];
            }
            for (var dotId in indicatorDots) {
                indicatorDots[dotId].attr('opacity', 0);
            }
            
            // draw piece selector dots on pieces that may be able to move
            for (var squareId in game.position()) {
                if (game.position()[squareId].color === game.toMove()) {
                    pieceSelectorDots[squareId] = new PieceSelectorDot(squareId);
                }
            }
            
            // reinitialize the board interface
            drawPosition();
            for (var squareId in board) {
                pieceSelectorDots[squareId] = new PieceSelectorDot(squareId);
            }
            
            // alert if position is checkmate
            if (game.isCheckMate()) { alert('checkmate!') };
        }
        
        dot.on('click', makeMove);
        
        return dot;
    }
    
    var pieceSelectorDots = {};
    function PieceSelectorDot(squareId) {
        
        var dot = new Dot(squareId);
        
        function getMoveOptions() {
            
            if (
                !game.position()[squareId] ||
                game.position()[squareId].color !== game.toMove()
               ) {
                return [];
            }
            
            var piece = game.position()[squareId];
            var range = piece.range(game.position());
            
            var moveOptions = [];
            for (var i = 0; i < range.length; i += 1) {
                var endSquareId = range[i];
                var newPosition = {};
                for (property in game.position()) {
                    newPosition[property] = game.position()[property];
                }
                var newPiece = new chessSet[piece.pieceType](piece.color, endSquareId);
                newPosition[endSquareId] = newPiece;
                delete newPosition[squareId];
                // TODO: implement no castling through check
                var castlingThroughCheck = false;
                if (
                    !game.isCheck(newPosition, piece.color) &&
                    !castlingThroughCheck
                   ) {
                    moveOptions.push(endSquareId);
                }
            }
            return moveOptions;
        }
        
        function showMoveOptionDots() {
            
            // clean up the move indicator dots
            for (var dotId in indicatorDots) {
                indicatorDots[dotId].attr('opacity', 0);
            }
            
            var moveOptions = getMoveOptions();
            for (var i = 0; i < moveOptions.length; i += 1) {
                indicatorDots[moveOptions[i]].attr('opacity', 1);
                moveOptionDots[moveOptions[i]] = new moveOptionDot(squareId, moveOptions[i]);
            }
        }
        
        dot.on('click', showMoveOptionDots);
        
        return dot;
    }
    
    // initialize interface
    for (var squareId in board) {
        pieceSelectorDots[squareId] = new PieceSelectorDot(squareId);
    }
    
//    for (var squareId in board) {
//        var coordinates = getCoordinates(squareId);
//        svg.append('text')
//           .attr('id', 'label-' + squareId)
//           .attr('x', coordinates.x)
//           .attr('y', coordinates.y)
//           .attr('text-anchor', 'middle')
//           .text(squareId);
//    }

}

///
});
