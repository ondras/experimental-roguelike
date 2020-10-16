/**
 * Level repository & tricks
 */
Game.Levels = function() {
	this._cache = {};
	this._fileCtor = Game.Level;
	this._jsNamespace = Game.Level;
}

/**
 * @param {string} levelName
 * @returns {Promise}
 */
Game.Levels.prototype.get = function(levelName) {
	if (levelName in this._cache) {
		return new Promise().fulfill(this._cache[levelName]);
	} else {
		var parts = levelName.split(":");
		var proto = parts[0];
		var name = parts[1];

		var cache = function(level) {
			this._cache[levelName] = level;
			return level;
		}.bind(this);

		switch (proto) {
			case "js": 
				return new Promise().fulfill(this._getJS(name)).then(cache); 
			break;
			case "file": 
				return this._getFile(name).then(cache); 
			break;
			default: 
				throw new Error("Cannot handle level '" + levelName + "'"); 
			break;
		}
	}
}

Game.Levels.prototype.transition = function(newLevel, oldLevel, direction) {
	var oppositeMap = {
		left: "right",
		right: "left",
		top: "bottom",
		bottom: "top",
		fade: "fade"
	};

	var newNode = newLevel.getContainer();
	newNode.className = direction;
	document.querySelector("#level").appendChild(newNode);

	document.body.offsetWidth;

	if (oldLevel) { oldLevel.getContainer().className = oppositeMap[direction]; }
	newNode.className = "";
}

/**
 * @returns {Promise}
 */
Game.Levels.prototype._getFile = function(levelName) {
	var levelName = "levels/" + levelName + ".txt?" + ROT.RNG.getUniform();
	return Promise.request(levelName).then(function(data) {
		return new this._fileCtor().fromTemplate(data);
	}.bind(this), function(error) {
		Game.status.error
	});
}

/**
 * @returns {Promise}
 */
Game.Levels.prototype._getJS = function(levelName) {
	levelName = levelName.match(/^[^\?]+/)[0];
	var ctor = this._jsNamespace[levelName.capitalize()];
	return new ctor();
}
