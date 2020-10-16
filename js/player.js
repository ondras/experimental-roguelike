Game.Player = function(type) {
	Game.Being.call(this, type);

	this._actionKeys = {};
	this._actionKeys[ROT.VK_PERIOD] = 1;
	this._actionKeys[ROT.VK_CLEAR] = 1;
	this._actionKeys[ROT.VK_NUMPAD5] = 1;

	this._directionKeys = {
		"4": {},
		"6": {},
		"8": {}
	};
	this._directionKeys[4][ROT.VK_K] = 0;
	this._directionKeys[4][ROT.VK_UP] = 0;
	this._directionKeys[4][ROT.VK_NUMPAD8] = 0;
	this._directionKeys[4][ROT.VK_L] = 1;
	this._directionKeys[4][ROT.VK_RIGHT] = 1;
	this._directionKeys[4][ROT.VK_NUMPAD6] = 1;
	this._directionKeys[4][ROT.VK_J] = 2;
	this._directionKeys[4][ROT.VK_DOWN] = 2;
	this._directionKeys[4][ROT.VK_NUMPAD2] = 2;
	this._directionKeys[4][ROT.VK_H] = 3;
	this._directionKeys[4][ROT.VK_LEFT] = 3;
	this._directionKeys[4][ROT.VK_NUMPAD4] = 3;

	this._directionKeys[6][ROT.VK_Y] = 0;
	this._directionKeys[6][ROT.VK_NUMPAD7] = 0;
	this._directionKeys[6][ROT.VK_U] = 1;
	this._directionKeys[6][ROT.VK_NUMPAD9] = 1;
	this._directionKeys[6][ROT.VK_L] = 2;
	this._directionKeys[6][ROT.VK_RIGHT] = 2;
	this._directionKeys[6][ROT.VK_NUMPAD6] = 2;
	this._directionKeys[6][ROT.VK_N] = 3;
	this._directionKeys[6][ROT.VK_NUMPAD3] = 3;
	this._directionKeys[6][ROT.VK_B] = 4;
	this._directionKeys[6][ROT.VK_NUMPAD1] = 4;
	this._directionKeys[6][ROT.VK_H] = 5;
	this._directionKeys[6][ROT.VK_LEFT] = 5;
	this._directionKeys[6][ROT.VK_NUMPAD4] = 5;
	this._directionKeys[6][ROT.VK_K] = 0;
	this._directionKeys[6][ROT.VK_UP] = 0;
	this._directionKeys[6][ROT.VK_NUMPAD8] = 0;
	this._directionKeys[6][ROT.VK_J] = 3;
	this._directionKeys[6][ROT.VK_DOWN] = 3;
	this._directionKeys[6][ROT.VK_NUMPAD2] = 3;

	this._directionKeys[8][ROT.VK_K] = 0;
	this._directionKeys[8][ROT.VK_UP] = 0;
	this._directionKeys[8][ROT.VK_NUMPAD8] = 0;
	this._directionKeys[8][ROT.VK_U] = 1;
	this._directionKeys[8][ROT.VK_NUMPAD9] = 1;
	this._directionKeys[8][ROT.VK_L] = 2;
	this._directionKeys[8][ROT.VK_RIGHT] = 2;
	this._directionKeys[8][ROT.VK_NUMPAD6] = 2;
	this._directionKeys[8][ROT.VK_N] = 3;
	this._directionKeys[8][ROT.VK_NUMPAD3] = 3;
	this._directionKeys[8][ROT.VK_J] = 4;
	this._directionKeys[8][ROT.VK_DOWN] = 4;
	this._directionKeys[8][ROT.VK_NUMPAD2] = 4;
	this._directionKeys[8][ROT.VK_B] = 5;
	this._directionKeys[8][ROT.VK_NUMPAD1] = 5;
	this._directionKeys[8][ROT.VK_H] = 6;
	this._directionKeys[8][ROT.VK_LEFT] = 6;
	this._directionKeys[8][ROT.VK_NUMPAD4] = 6;
	this._directionKeys[8][ROT.VK_Y] = 7;
	this._directionKeys[8][ROT.VK_NUMPAD7] = 7;
}
Game.Player.extend(Game.Being);

Game.Player.prototype.act = function() {
	Game.status.describe();
	this._level.updateLighting();
	Game.engine.lock();
	this._listen();
}

Game.Player.prototype._listen = function() {
	Promise.event(window, "keydown").then(this._keyDown.bind(this)).then(null, function() { debugger });
}

Game.Player.prototype._keyDown = function(e) {
	var code = e.keyCode;

	var keyHandled = this._handleKey(e.keyCode);

	if (keyHandled) {
		Game.engine.unlock();
	} else {
		this._listen();
	}
}

Game.Player.prototype._handleKey = function(code) {
	if (code in this._actionKeys) {
		return this._action(this._actionKeys[code]);
	}

	var topology = this._level.getTopology();
	var directionKeys = this._directionKeys[topology];
	if (code in directionKeys) {
		var dir = ROT.DIRS[topology][directionKeys[code]];
		var x = this._position[0] + dir[0];
		var y = this._position[1] + dir[1];
		if (this._isPassable(x, y)) { /* MOVE */
			this._level.setBeing(this, x, y);
			return true;
		}

		var cell = this._level.cells[x+","+y];
		if (cell instanceof Game.Cell.Door) {
			if (cell.isLocked()) {
				Game.status.message("The door is locked.");
				return false;
			}
			cell.open();
			return true;
		}

		return false; /* wall */
	}

	return false; /* unknown key */
}

Game.Player.prototype.setPosition = function(x, y, level) {
	if (this._position) { this._level.removeLight(this._position[0], this._position[1], [100, 100, 30]); }

	Game.Being.prototype.setPosition.call(this, x, y, level);

	if (x !== null) { this._level.addLight(x, y, [100, 100, 30]); }
}

Game.Player.prototype._action = function() {
	/* FIXME action */
}
