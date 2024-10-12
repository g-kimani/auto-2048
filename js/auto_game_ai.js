function AutoAI(gameManager) {
  this.gameManager = gameManager;
  this.size = 4;
  //   console.log("🚀 ~  ~ gameManager:", gameManager);
  //   setTimeout(() => {
  //     this.move(0);
  //     console.log("hmm");
  //     //   this.move(2);
  //     setTimeout(() => {
  //       this.move(2);
  //     }, 500);
  //   });
  const aiMessage = document.getElementById("ai-message");
  const calculateButton = document.getElementById("calculate-move");
  calculateButton.addEventListener("click", () => {
    aiMessage.textContent = "AI HAS BEEN SUMMONED....";
    let direction;
    direction = this.calculateMove();
    aiMessage.textContent =
      "AI HAS DECIDED " + ["up", "r", "d", "l"][direction];
    this.move(direction);
  });
}

AutoAI.prototype.move = function (direction) {
  this.gameManager.move(direction);
};

AutoAI.prototype.calculateMove = function () {
  const testGrid = new Grid(4, this.gameManager.grid.cells);
  const availableCells = testGrid.availableCells();
  console.log("🚀 ~ availableCells:", availableCells);
  const totalMoveScores = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
  };
  // simulate every possible computer move
  for (let i = 0; i < availableCells.length; i++) {
    const cell = availableCells[i];
    // placing a 2 tile
    testGrid.insertTile(new Tile(cell, 2));
    // test every human move
    // ? need a way to calculate the most likely move.
    // ? we know a human wont move up if it is not even a possible move (no pieces will actually slide in position and no merges)
    const directionMoveScores = [];
    const directions = [0, 1, 2, 3];
    const abrev = ["up", "r", "d", "l"];
    for (let direction of directions) {
      let scores = {};
      this.simulateMove(testGrid, direction, (scores = scores));
      //   console.log(scores);
      let totalScore = 0;
      Object.keys(scores).forEach((k) => {
        totalScore += scores[k] >> 2;
        scores[k] = {
          score: scores[k] >> 2,
          direction: scores[k] & 0b11,
        };
      });
      directionMoveScores.push([abrev[direction], totalScore, scores]);
      totalMoveScores[direction] += totalScore;
    }
    // console.log(directionMoveScores);
    // and a 4 tile
    testGrid.removeTile(cell);
    testGrid.insertTile(new Tile(cell, 4));
  }
  console.log(totalMoveScores);

  const highestScore = Math.max(...Object.values(totalMoveScores));
  const bestMove = Object.entries(totalMoveScores).find(
    (mv) => mv[1] === highestScore
  );
  return bestMove[0];
};

AutoAI.prototype.simulateMove = function (
  grid,
  direction,
  scores = {},
  depth = 1,
  maxDepth = 2
) {
  if (depth > maxDepth) return scores;
  const moveGrid = new Grid(4, grid.cells);
  const moved = this.applyMove(moveGrid, direction);
  const gridScore = moved ? this.calculateGridScore(moveGrid) : 0;
  scores[depth] =
    scores[depth] > gridScore ? scores[depth] : (gridScore << 2) + direction;
  const directions = [0, 1, 2, 3];
  for (let direction of directions) {
    this.simulateMove(moveGrid, direction, scores, depth + 1);
  }
  return scores;
};

AutoAI.prototype.calculateGridScore = function (grid) {
  //   console.log("🚀 ~ grid:", grid);
  //   console.log(grid);
  let score = 0;
  //? num of empty locations - having more empty means joining numbers more
  score += grid.availableCells().length * -1;
  //? num of tile matches available
  //   console.log(this.tileMatchesAvailable(grid, true));
  //   score += this.tileMatchesAvailable(grid, true);
  // ? largest tile on the board
  score += grid.largestTile() * 1000;
  return score;
};

AutoAI.prototype.applyMove = function (grid, direction) {
  var self = this;
  var vector = this.getVector(direction);

  const traversals = this.buildTraversals(vector);
  var moved = false;
  var cell, tile;

  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(grid, cell, vector);
        var next = grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          grid.insertTile(merged);
          grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          grid.score += merged.value;

          // The mighty 2048 tile
          if (merged.value === 2048) self.won = true;
        } else {
          grid.removeTile(tile);
          tile.updatePosition(positions.farthest);
          grid.insertTile(tile);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  if (moved) {
    // ! add random tile
    if (grid.cellsAvailable()) {
      var value = Math.random() < 0.9 ? 2 : 4;
      var tile = new Tile(grid.randomAvailableCell(), value);
      grid.insertTile(tile);
    }

    if (!grid.cellsAvailable() || !this.tileMatchesAvailable(grid)) {
      this.over = true; // Game over!
    }
  }
  return moved;
};
AutoAI.prototype.allVectors = function () {
  return {
    0: { x: 0, y: -1 }, // Up
    1: { x: 1, y: 0 }, // Right
    2: { x: 0, y: 1 }, // Down
    3: { x: -1, y: 0 }, // Left
  };
};
AutoAI.prototype.getVector = function (direction) {
  return this.allVectors()[direction];
};

AutoAI.prototype.tileMatchesAvailable = function (grid, getCount = false) {
  var self = this;

  var tile;
  let count = 0;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = grid.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell = { x: x + vector.x, y: y + vector.y };

          var other = grid.cellContent(cell);

          if (other && other.value === tile.value) {
            if (getCount) {
              count++;
            } else {
              return true; // These two tiles can be merged
            }
          }
        }
      }
    }
  }

  return count;
};
AutoAI.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};
AutoAI.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

AutoAI.prototype.findFarthestPosition = function (grid, cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (grid.withinBounds(cell) && grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell, // Used to check if a merge is required
  };
};
