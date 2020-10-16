Game.Level.Random = function() {
	Game.Level.call(this);
	this._ambientLight = [120, 120, 120];
	this._name = "Random dungeon";
	this._build();
}
Game.Level.Random.extend(Game.Level);

Game.Level.Random.prototype._build = function() {
	var width = 40;
	var height = 25;

	var generator = new ROT.Map.Digger(width, height);

	var bitMap = [];
	for (var i=0;i<width;i++) { bitMap[i] = []; }

	generator.create(function(x, y, type) {
		bitMap[x][y] = type;
	});

	this._buildFromBitMap(bitMap);

	this._display.setOptions({width:width, height:height});
	this.updateLighting();
}

Game.Level.Random.prototype._buildFromBitMap = function(bitMap) {
	var W = bitMap.length;
	var H = bitMap[0].length;
	var avail = [];

	for (var i=0;i<W;i++) {
		for (var j=0;j<H;j++) {
			var value = bitMap[i][j];

			switch (value) {
				case 0:
					var neighborCount = this._getNeighborCount(bitMap, i, j, 0);
					if (neighborCount == 8) { avail.push(i+","+j); } /* suitable for portal */
					var floor = Game.Cells.create("floor");
					this.setCell(floor, i, j);
				break;

				case 1:
					var neighborCount = this._getNeighborCount(bitMap, i, j, 0);
					if (neighborCount > 0) {
						var wall = Game.Cells.create("stonewall");
						this.setCell(wall, i, j);
					}
				break;
			}

		}
	}

	avail = avail.randomize();

	var startCell = Game.Cells.create("staircase-up");
	startCell.setId("start");
	startCell.setPortal("file:start", "top", "fade");
	var pos = avail[0].split(",");
	this.setCell(startCell, parseInt(pos[0]), parseInt(pos[1]));

	var endCell = Game.Cells.create("staircase-down");
	endCell.setPortal("js:random?"+ROT.RNG.getUniform(), "start", "fade");
	var pos = avail[1].split(",");
	this.setCell(endCell, parseInt(pos[0]), parseInt(pos[1]));
}

Game.Level.Random.prototype._getNeighborCount = function(bitMap, x, y, value) {
	var result = 0;

	for (var dx=-1; dx<=1; dx++) {
		for (var dy=-1; dy<=1; dy++) {
			if (!dx && !dy) { continue; }
			var i = x+dx;
			var j = y+dy;
			if (!bitMap[i]) { continue; }
			if (bitMap[i][j] === value) { result++; }
		}
	}

	return result;
}
