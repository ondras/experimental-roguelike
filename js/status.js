Game.Status = function() {
	this._dom = {
		container: document.querySelector("#status"),
		level: document.createElement("div"),
		description: document.createElement("div"),
		message: document.createElement("div")
	}
	this._directions = {
		"4": {},
		"6": {},
		"8": {}
	}
	this._directions[8][0] = this._directions[4][0] = "north";
	this._directions[8][2] = this._directions[4][1] = this._directions[6][2] = "east";
	this._directions[8][4] = this._directions[4][2] = "south";
	this._directions[8][6] = this._directions[4][3] = this._directions[6][5] = "west";
	this._directions[8][7] = this._directions[6][0] = "north-west";
	this._directions[8][1] = this._directions[6][1] = "north-east";
	this._directions[8][3] = this._directions[6][3] = "south-east";
	this._directions[8][5] = this._directions[6][4] = "south-west";
	
	this._dom.container.appendChild(this._dom.level);
	this._dom.container.appendChild(this._dom.description);
	this._dom.container.appendChild(this._dom.message);
}

Game.Status.prototype.describe = function() {
	var position = Game.player.getPosition();
	var key = position.join(",");
	var cell = Game.level.cells[key];
	
	var parts = [];
	parts.push(cell.describeA().capitalize() + ".");
	
	var item = Game.level.items[key];
	if (item) { parts.push("There is " + item.describeA() + " lying here."); }
	
	var interesting = this._describeInteresting(position);
	if (interesting) { parts.push(interesting); }
	
	this._dom.description.innerHTML = parts.join(" ");
}

Game.Status.prototype.setLevel = function(level) {
	this._dom.level.innerHTML = "Currently in: " + level;
}

Game.Status.prototype.showMessage = function(message) {
	this._dom.message.innerHTML = message;
}

Game.Status.prototype._describeInteresting = function(position) {
	var topology = Game.level.getTopology();
	var directions = this._directions[topology];
	var dirs = ROT.DIRS[topology];
	var result = [];
	
	for (var i=0;i<dirs.length;i++) {
		var x = position[0] + dirs[i][0];
		var y = position[1] + dirs[i][1];
		var key = x+","+y;
		var entities = this._getInterestingEntities(key);
		for (var j=0;j<entities.length;j++) {
			result.push([entities[j], i]);
		}
	}
	
	if (!result.length) { return null; }
	
	var str = "You see ";
	if (result.length == 1) {
		str += result[0][0].describeA();
	} else {
		for (var i=0;i<result.length;i++) { 
			var entity = result[i][0];
			var direction = result[i][1];
			var part = entity.describeA() + " (" + directions[direction] + ")";
			
			if (i) {
				var glue = (i+1 == result.length ? " and" : ",");
				result[i] = glue + " " + part;
			} else {
				result[i] = part;
			}
		}
		str += result.join("");
	}
	str += ".";
	return str;
}

Game.Status.prototype._getInterestingEntities = function(key) {
	var names = ["beings", "items", "cells"];
	var result = [];
	for (var i=0;i<names.length;i++) {
		var entity = Game.level[names[i]][key];
		if (entity && entity.isInteresting()) { result.push(entity); }
	}
	return result;
}
