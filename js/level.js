Game.Level = function() {
	this.cells = {};
	this.beings = {};
	this.items = {};

	this._display = new ROT.Display({fontFamily:"droid sans mono, monospace"});
	this._ambientLight = [0, 0, 0];
	this._topology = 8;
	this._lights = {};
	this._defaultCell = "floor";
	this._name = "";

	this._node = document.createElement("section");
	this._node.appendChild(this._display.getContainer());

	this._lighting = new ROT.Lighting(this._getReflectivity.bind(this), {passes:1});
	var fov = new ROT.FOV.PreciseShadowcasting(this._lightPasses.bind(this), {topology:this._topology});
	this._lighting.setFOV(fov);
}

Game.Level._cache = {};

Game.Level.prototype.getDefaultCellTypes = function() {
	/* FIXME? */
	return ["stonewall", "floor"];
}

Game.Level.prototype.fromTemplate = function(data) {
	var br = data.indexOf("\n\n");
	if (br == -1) { return; }
	var lines = data.substring(0, br).split("\n");
	var def = JSON.parse(data.substring(br));
	
	if (def.level) {
		if ("name" in def.level) { this._name = def.level.name; }
		if ("ambient" in def.level) { this._ambientLight = def.level.ambient; }
		if ("cell" in def.level) { this._defaultCell = def.level.cell; }
		if ("topology" in def.level) { 
			this._topology = def.level.topology; 
			var fov = new ROT.FOV.PreciseShadowcasting(this._lightPasses.bind(this), {topology:this._topology});
			this._lighting.setFOV(fov);
			var options = {};
			if (this._topology == 6) {
				options.layout = "hex";
				options.spacing = 0.9;
			} else {
				options.layout = "rect";
				options.spacing = 1;
			}
			this._display.setOptions(options);
		}
	}

	var width = 0, height = 0;

	for (var j=0;j<lines.length;j++) {
		var line = lines[j];
		if (!line.length) { continue; }
		height++;
		width = Math.max(width, line.length);
		
		for (var i=0;i<line.length;i++) {
			var ch = line.charAt(i);
			if (ch == " ") { continue; }

			var d = def[ch];
			if (!d) { throw new Error("Unknown character '" + ch + "'"); }

			this._fromChar(i, j, d);
		}
	}

	this._display.setOptions({width:width, height:height});

	this.updateLighting();
	return this;
}

Game.Level.prototype._fromChar = function(x, y, def) {
	if (def.cell) {
		if (typeof(def.cell) == "object" && !def.cell.type) { def.cell.type = this._defaultCell; }
		var cell = Game.Cells.createFromObject(def.cell);
	} else {
		var cell = Game.Cells.createFromObject(this._defaultCell);
	}
	this.setCell(cell, x, y);

	if (def.being) {
		var being = Game.Beings.createFromObject(def.being);
		this.setBeing(being, x, y);
	}
	
	if (def.item) {
		var item = Game.Items.createFromObject(def.item);
		this.setItem(item, x, y);
	}
	
	if (def.light) {
		this.addLight(x, y, def.light);
	}
}

Game.Level.prototype.getContainer = function() {
	return this._node;
}

Game.Level.prototype.getCellById = function(id) {
	for (var key in this.cells) {
		if (this.cells[key].getId() == id) { return this.cells[key]; }
	}
	return null;
}

Game.Level.prototype.getTopology = function() {
	return this._topology;
}

Game.Level.prototype.getName = function() {
	return this._name;
}

Game.Level.prototype.resetLighting = function() {
	this._lighting.reset();
}

Game.Level.prototype.addLight = function(x, y, light) {
	var key = x+","+y;
	if (key in this._lights) {
		this._lights[key] = ROT.Color.add(this._lights[key], light);
	} else {
		this._lights[key] = light;
	}

	this._lighting.setLight(x, y, this._lights[key]);
}

Game.Level.prototype.removeLight = function(x, y, light) {
	var key = x+","+y;

	var targetLight = ROT.Color.add(this._lights[key], [-light[0], -light[1], -light[2]]);
	if (targetLight[0] == 0 && targetLight[1] == 0 && targetLight[2] == 0) { 
		delete this._lights[key];
	} else {
		this._lights[key] = targetLight;
	}

	this._lighting.setLight(x, y, this._lights[key]);
}

Game.Level.prototype.drawAll = function() {
	for (var key in this.cells) {
		var parts = key.split(",");
		this._draw(parseInt(parts[0]), parseInt(parts[1]));
	}
}

Game.Level.prototype.setCell = function(cell, x, y) {
	var key = x+","+y;
	var oldBlocking = (this.cells[key] ? this.cells[key].blocksLight() : null);

	this._setEntity(cell, x, y, "cells");
	
	var newBlocking = cell.blocksLight();
	if (oldBlocking != newBlocking) { this._lighting.reset(); }
}

Game.Level.prototype.setBeing = function(being, x, y) {
	this._setEntity(being, x, y, "beings");
}
	
Game.Level.prototype.setItem = function(item, x, y) {
	this._setEntity(item, x, y, "items");
}

Game.Level.prototype.removeBeing = function(being) {
	this._removeEntity(being, "beings");
}

Game.Level.prototype.resize = function(width, height) {
	var fontSize = this._display.computeFontSize(width, height);
	this._display.setOptions({fontSize:fontSize});
	var canvas = this._display.getContainer();
	canvas.style.top = Math.floor((height-canvas.height)/2) + "px";
}

Game.Level.prototype.updateLighting = function() {
	var dirty = {};
	var cells = this.cells;
	
	for (var key in cells) {
		var cell = cells[key];
		if (!cell.getLight()) { continue; }
		dirty[key] = 1;
		cell.setLight(null);
	}

	this._lighting.compute(function(x, y, color) {
		var key = x+","+y;
		if (!cells[key]) { return; }
		cells[key].setLight(color);
		dirty[key] = 1;
	});
	
	for (var key in dirty) {
		var cell = cells[key];
		cell.computeColor(this._ambientLight);
		
		if (this.items[key]) { this.items[key].computeColor(this._ambientLight); }
		if (this.beings[key]) { this.beings[key].computeColor(this._ambientLight); }
		
		var parts = key.split(",");
		this._draw(parseInt(parts[0]), parseInt(parts[1]));
	}
},

/**
 * @param {Game.Entity}
 */
Game.Level.prototype._setEntity = function(entity, x, y, type) {
	var oldPosition = entity.getPosition();
	if (oldPosition) {
		var oldKey = oldPosition.join(",");
		if (this[type][oldKey] == entity) { 
			delete this[type][oldKey]; 
		} else { /* remove the old one */
			this._removeEntity(entity, x, y, type);
		}
		this._draw(oldPosition[0], oldPosition[1]);
	}

	entity.setPosition(x, y, this);
	entity.computeColor(this._ambientLight);

	if (x !== null) {
		var key = x+","+y;
		this[type][key] = entity;
		this._draw(x, y);
		var cell = this.cells[key];
		cell.notify(entity);
	}
	
}

Game.Level.prototype._removeEntity = function(entity, type) {
	var oldPosition = entity.getPosition();
	if (!oldPosition) { return; }

	var oldKey = oldPosition.join(",");
	if (this[type][oldKey] == entity) { delete this[type][oldKey]; }
	entity.setPosition(null);

	this._draw(oldPosition[0], oldPosition[1]);
}

Game.Level.prototype._draw = function(x, y) {
	var key = x+","+y;

	var visual = this.beings[key] || this.items[key] || this.cells[key];
	if (visual) { this._display.draw(x, y, visual.getChar(), visual.getColor()); }
}

Game.Level.prototype._getReflectivity = function(x, y) {
	var key = x+","+y;

	var cell = this.cells[key];
	if (!cell) { return 0; }
	return (cell.blocksLight() ? 0 : 0.3);
}

Game.Level.prototype._lightPasses = function(x, y) {
	var key = x+","+y;

	var cell = this.cells[key];
	if (!cell) { return false; }

	return !(cell.blocksLight());
}
