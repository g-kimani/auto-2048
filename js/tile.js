function Tile(position, value) {
  this.x = position.x;
  this.y = position.y;
  this.position = position;
  this.value = value || 2;

  this.previousPosition = null;
  this.mergedFrom = null; // Tracks tiles that merged together
}

Tile.prototype.savePosition = function () {
  this.previousPosition = { x: this.x, y: this.y };
};

Tile.prototype.updatePosition = function (position) {
  this.x = position.x;
  this.y = position.y;
  this.position = position;
};

Tile.prototype.serialize = function () {
  return {
    position: this.position,
    value: this.value,
  };
};
