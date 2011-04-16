/**
 * @fileoverview This is a visualizer for the ant game.
 * @author <a href="mailto:marco.leise@gmx.de">Marco Leise</a>
 */

/*
 * @todo zoom in to 20x20 squares with animated ants
 * @todo menu items: clear, show attack, show birth,
 *     zoom, toggle graph/score bars, cpu use
 * @todo setting for cpu usage
 * @todo keep a minimum size to allow the controls to render
 * @todo show when a bot crashed
 * @todo switch to console.log for debug and load messages
 * @todo fix duplicate 'parsing replay...' messages
 */

LoadingState = {
	IDLE: 0,
	LOADING: 1,
	CLEANUP: 2
};

Key = {
	LEFT: 37,
	RIGHT: 39,
	SPACE: 32,
	PGUP: 33,
	PGDOWN: 34,
	HOME: 36,
	END: 35
};

/**
 * @constructor
 */
function Location(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
}
Location.prototype.offX = function() {
	return this.x + this.w;
};
Location.prototype.offY = function() {
	return this.y + this.h;
};
Location.prototype.contains = function(x, y) {
	return (x >= this.x && x < this.x + this.w
		&& y >= this.y && y < this.y + this.h);
};

/**
 * @class The main 'application' object that provides all necessary methods for
 *     the use in a web page.
 * @constructor
 * @param {Node} container the html element, that the visualizer will embed into
 * @param {String} dataDir This relative path to the visualizer data files. You
 *     will get an error message if you forget the tailing '/'.
 * @param {Number} w an optional maximum width or undefined
 * @param {Number} h an optional maximum height or undefined
 */
Visualizer = function(container, dataDir, w, h) {
	/**
	 * any generated DOM elements will be placed here
	 * @private
	 */
	this.container = container;
	/**
	 * contains the backdrop for the map
	 * @private
	 */
	this.map = {};
	/**
	 * Caches the graphics of the map border
	 * @private
	 */
	this.border = {};
	/**
	 * Caches overlay graphics like fog
	 * @private
	 */
	this.overlay = {};
	/**
	 * Caches the score graph
	 * @private
	 */
	this.scores = {};
	/**
	 * array of precomputed turn data
	 * @private
	 */
	this.turns = undefined;
	/**
	 * usable width for the visualizer
	 * @private
	 */
	this.w = w;
	/**
	 * usable height for the visualizer
	 * @private
	 */
	this.h = h;
	/**
	 * locations of elements on the screen
	 * @private
	 */
	this.loc = {};
	/**
	 * size of an ant in pixels
	 * @private
	 */
	this.scale = undefined;
	/**
	 * manages playback commands and timing
	 * @private
	 */
	this.director = new Director(this);
	/**
	 * presistable configuration values
	 * @private
	 */
	this.config = new Config();
	/**
	 * Options from URL GET parameters or the constructor arguments
	 * @private
	 */
	this.options = {};
	this.options['data_dir'] = dataDir;
	// read URL parameters and store them in the parameters object
	var equalPos, value, key, i;
	var parameters = window.location.href;
	if ((i = parameters.indexOf('?')) !== -1) {
		parameters = parameters.substr(i + 1).split('#')[0].split('&');
		for (i = 0; i < parameters.length; i++) {
			equalPos = parameters[i].indexOf('=');
			key = parameters[i].substr(0, equalPos);
			value = parameters[i].substr(equalPos + 1);
			if (key === 'debug' || key === 'profile') {
				value = new Boolean(value);
			}
			this.options[key] = value;
		}
	}
	/**
	 * @private
	 */
	this.mouseX = -1;
	/**
	 * @private
	 */
	this.mouseY = -1;
	/**
	 * @private
	 */
	this.shiftX = 0;
	/**
	 * @private
	 */
	this.shiftY = 0;
	/**
	 * @private
	 */
	this.mouseDown = 0;
	/**
	 * @private
	 */
	/**
	 * buttons
	 * @private
	 */
	this.btnMgr = new ButtonManager(this);
	/**
	 * @private
	 */
	this.log = document.createElement('div');
	var text = 'Loading visualizer...';
	text += '<table>';
	for (key in this.options) {
		value = this.options[key];
		text += '<tr><td>-&nbsp;</td><td>' + key + '&nbsp;&nbsp;</td><td><b>' + value + '&nbsp;&nbsp;</b></td><td><i>';
		if (key == "data_dir") {
			text += '(Image directory)';
		}
		text += '</i></td></tr>';
	}
	text += '</table>';
	while (this.container.hasChildNodes()) {
		this.container.removeChild(this.container.lastChild);
	}
	this.log.innerHTML = text;
	this.container.appendChild(this.log);
	/**
	 * images used by the visualizer
	 * @private
	 */
	this.imgMgr = new ImageManager((dataDir || '') + 'img/', this,
			this.completedImages);
	this.imgMgr.add('wood.jpg');
	this.imgMgr.add('playback.png');
	this.imgMgr.add('fog.png');
	this.imgMgr.add('toolbar.png');
	/**
	 * the highest player count in a previous replay to avoid button repaints
	 * @private
	 */
	this.highestPlayerCount = 0;
	// state information that must be reset on error/reload
	/**
	 * @private
	 */
	this.replay = undefined;
	/**
	 * the main canvas
	 * @private
	 */
	this.main = {};
	/**
	 * @private
	 */
	this.fog = undefined;
	this.loading = LoadingState.IDLE;
	this.imgMgr.startRequests();
}
/**
 * @private
 */
Visualizer.prototype.progress = function(log, func) {
	if (this.loading !== LoadingState.LOADING) return;
	var vis = this;
	if (log) this.logOut(log);
	window.setTimeout(function() {
		try {
			func();
		} catch (error) {
			// (for Firefox Java errors:) if error is just a string, wrap it into an object
			if (typeof error == 'string') error = {message: error};
			var msg = '';
			for(var key in error) {
				var escaped = new String(error[key]).replace('&', '&amp;');
				escaped = escaped.replace('<', '&lt;').replace('>', '&gt;');
				msg += '<p><u><b>Error ' + key + ':</b></u>\n' + escaped + '</p>';
			}
			vis.errorOut(msg);
			var selectedPosX = 0;
			var selectedPosY = 0;
			var obj = vis.log;
			if (vis.log.offsetParent) do {
				selectedPosX += obj.offsetLeft;
				selectedPosY += obj.offsetTop;
			} while ((obj = obj.offsetParent));
			window.scrollTo(selectedPosX, selectedPosY);
		}
	}, 50);
};
/**
 * Places a paragraph with a message in the visualizer dom element.
 * @param {string} text the message text
 * @private
 */
Visualizer.prototype.logOut = function(text) {
	text = text.replace(/\n/g, '<br>');
	this.log.innerHTML += text + '<br>';
};
/**
 * Stops loading, cleans up the instance and calls logOut with the text in red.
 * @param {string} text the error message text
 * @private
 */
Visualizer.prototype.errorOut = function(text) {
	this.logOut('<font color="red">' + text + '</font>');
	this.cleanUp();
};
/**
 * @private
 */
Visualizer.prototype.cleanUp = function() {
	this.loading = LoadingState.CLEANUP;
	this.imgMgr.cleanUp();
	this.director.cleanUp();
	if (this.replay && this.replay instanceof XMLHttpRequest) this.replay.abort();
	this.replay = undefined;
	if (this.main.element) {
		if (this.container.firstChild === this.main.element) {
			this.container.removeChild(this.main.element);
		}
	}
	this.fog = undefined;
	document.onkeydown = null;
	document.onkeyup = null;
	document.onkeypress = null;
	window.onresize = null;
	this.log.style.display = 'block';
};
Visualizer.prototype.preload = function() {
	if (this.loading !== LoadingState.IDLE) return true;
	this.log.innerHTML = '';
	this.cleanUp();
	this.loading = LoadingState.LOADING;
	return false;
};

/**
 * Loads a replay file located on the same server using a XMLHttpRequest.
 * @param {string} file the relative file name
 */
Visualizer.prototype.loadReplayDataFromURI = function(file) {
	if (this.preload()) return;
	var vis = this;
	this.progress('Fetching replay from: <i>' + file + '</i>...', function() {
		vis.replay = new XMLHttpRequest();
		vis.replay.onreadystatechange = function() {
			if (vis.replay.readyState === 4) {
				if (vis.loading === LoadingState.LOADING) {
					if (vis.replay.status === 200) {
						vis.replay = '' + vis.replay.responseText;
						vis.loadParseReplay();
					} else {
						vis.errorOut('Status ' + vis.replay.status + ': ' + vis.replay.statusText);
					}
				}
			}
		};
		vis.replay.open("GET", file);
		if (vis.options['debug']) {
			vis.replay.setRequestHeader('Cache-Control', 'no-cache');
		}
		vis.replay.send();
		vis.loadCanvas(true);
	});
};
/**
 * Loads a replay string directly.
 * @param {string} data the replay string
 */
Visualizer.prototype.loadReplayData = function(data) {
	if (this.preload()) return;
	this.replay = data;
	this.loadCanvas(true);
};
/**
 * @private
 */
Visualizer.prototype.loadParseReplay = function() {
	var vis = this;
	this.progress('Parsing the replay...', function() {
		if (!vis.replay) {
			if (vis.loading !== LoadingState.CLEANUP) {
				throw new Error('Replay is undefined.');
			}
		} else if (vis.replay instanceof Replay) { // has just been parsed
			return;
		} else if (typeof vis.replay == 'string') { // string only
			vis.replay = new Replay(vis.replay);
		} else if (vis.replay instanceof XMLHttpRequest) { // wait for the reply
			return;
		} else {
			throw new Error('Something unknown is in the replay variable: ' + vis.replay);
		}
		vis.tryStart();
	});
};
/**
 * Creates a canvas element
 * @private
 */
Visualizer.prototype.loadCanvas = function(prompt) {
	var vis = this;
	this.progress(prompt ? 'Creating canvas...' : undefined, function() {
		if (!vis.main.element) {
			vis.main.element = document.createElement('canvas');
			vis.main.canvas = vis.main.element;
		}
		vis.main.ctx = vis.main.canvas.getContext('2d');
		e = vis.main.element;
		if (vis.container.firstChild !== e) {
			vis.container.insertBefore(e, vis.log);
		}
		vis.createCanvas(vis.map);
		vis.createCanvas(vis.border);
		vis.createCanvas(vis.overlay);
		vis.createCanvas(vis.scores);
		vis.tryStart();
	});
};
/**
 * Called by the ImageManager when no more images are loading
 */
Visualizer.prototype.completedImages = function(error) {
	if (error) {
		this.errorOut(error);
	} else {
		this.tryStart();
	}
};
/**
 * Checks if we have a drawing context (canvas/applet), the images and the
 * replay. If all components are loaded it starts playback.
 */
Visualizer.prototype.tryStart = function() {
	if (this.replay === undefined) return;
	// we need to parse the replay, unless it has been parsed by the
	// XmlHttpRequest callback
	if (this.replay instanceof Replay) {
		if (this.main.ctx && !this.imgMgr.error && !this.imgMgr.pending) {
			var vis = this;
			// add static buttons
			if (!vis.btnMgr.groups['playback']) {
				var bg = vis.btnMgr.addImageGroup('playback',
						vis.imgMgr.images[1], ImageButtonGroup.HORIZONTAL,
						ButtonGroup.MODE_NORMAL, 2);
				bg.addButton(3, function() {vis.director.gotoTick(0)});
				bg.addSpace(32);
				bg.addButton(5, function() {
					var stop = (Math.ceil(vis.director.position * 2) - 1) / 2;
					vis.director.slowmoTo(stop);
				});
				//drawImage(this.imgMgr.images[1], 0 * 64, 0, 64, 64, x + 2.5 * 64, y, 64, 64);
				bg.addSpace(64);
				bg.addButton(4, function() {vis.director.playStop()});
				//drawImage(this.imgMgr.images[1], 1 * 64, 0, 64, 64, x + 4.5 * 64, y, 64, 64);
				bg.addSpace(64);
				bg.addButton(6, function() {
					var stop = (Math.floor(vis.director.position * 2) + 1) / 2;
					vis.director.slowmoTo(stop);
				});
				bg.addSpace(32);
				bg.addButton(2, function() {
					vis.director.gotoTick(vis.director.duration);
				});
				bg = vis.btnMgr.addImageGroup('toolbar', vis.imgMgr.images[3],
						ImageButtonGroup.VERTICAL, ButtonGroup.MODE_NORMAL, 2);
				if (this.config.hasLocalStorage()) {
					bg.addButton(0, function() {vis.config.save()});
				}
				if (!window.isFullscreenSupported || window.isFullscreenSupported()) {
					bg.addButton(1, function() {
						vis.setFullscreen(!vis.config['fullscreen']);
					});
				}
				bg.addButton(2, function() {
					vis.setZoom(!vis.config['zoom']);
					vis.director.draw();
				});
				bg.addButton(3, function() {
					vis.setBorder(!vis.config['border']);
					vis.director.draw();
				});
				bg.addButton(4, function() {
					vis.setAntLabels(!vis.config['label']);
					vis.director.draw();
				});
			}
			// generate fog images
			var colors = [null];
			for (i = 0; i < this.replay.players; i++) {
				colors.push(this.replay.meta['playercolors'][i]);
			}
			if (this.highestPlayerCount < this.replay.players) {
				this.highestPlayerCount = this.replay.players;
				this.imgMgr.colorize(2, colors);
			}
			bg = this.btnMgr.addImageGroup('fog', this.imgMgr.patterns[2],
				ImageButtonGroup.VERTICAL, ButtonGroup.MODE_RADIO, 2);
			var buttonAdder = function(fog) {
				return bg.addButton(i, function() {vis.showFog(fog);});
			}
			for (var i = 0; i < colors.length; i++) {
				if (i == 0) {
					buttonAdder(undefined).down = true;
				} else {
					buttonAdder(i - 1);
				}
			}
			// add player buttons
			bg = this.btnMgr.addTextGroup('players', TextButtonGroup.FLOW,
					ButtonGroup.MODE_NORMAL, 2);
			bg.addButton('Players:', '#888');
			buttonAdder = function(i) {
				var color = vis.replay.htmlPlayerColors[i];
				var func = null;
				if (vis.replay.meta['user_url'] && vis.replay.meta['user_ids']
						&& vis.replay.meta['user_ids'][i]) {
					func = function() {
						window.location.href =
								vis.replay.meta['user_url'].replace('~',
										vis.replay.meta['user_ids'][i]);
					};
				}
				bg.addButton(vis.replay.meta['players'][i], color, func);
			}
			for (i = 0; i < this.replay.players; i++) {
				buttonAdder(i);
			}
			// try to make the replays play 1 minute, but the turns take no more than a second
			this.director.duration = this.replay.turns.length - 1;
			this.director.defaultSpeed = Math.max(this.director.duration / 60, 1);
			this.director.onstate = function() {
				var btn = vis.btnMgr.groups['playback'].buttons[4];
				btn.offset = (vis.director.playing() ? 7 : 4) * vis.imgMgr.images[1].height;
				if (btn === vis.btnMgr.nailed) {
					vis.btnMgr.nailed = null;
				}
				btn.mouseUp();
			};
			// this will fire once in FireFox when a key is held down
			document.onkeydown = function(event) {
				if (!event) {
					// IE doesn't pass this as an argument
					event = window.event;
				}
				vis.keyPressed(event.keyCode);
			};
			// setup mouse handlers
			this.main.element.onmousemove = function(event) {
				var mx = 0;
				var my = 0;
				var obj = this;
				if (this.offsetParent) do {
					mx += obj.offsetLeft;
					my += obj.offsetTop;
				} while ((obj = obj.offsetParent));
				mx = (event || window.event).clientX - mx + ((window.scrollX === undefined) ? (document.body.parentNode.scrollLeft !== undefined) ? document.body.parentNode.scrollLeft : document.body.scrollLeft : window.scrollX);
				my = (event || window.event).clientY - my + ((window.scrollY === undefined) ? (document.body.parentNode.scrollTop !== undefined) ? document.body.parentNode.scrollTop : document.body.scrollTop : window.scrollY);
				vis.mouseMoved(mx, my);
			};
			this.main.element.onmouseout = function() {
				vis.mouseExited();
			};
			this.main.element.onmousedown = function() {
				vis.mousePressed();
			};
			this.main.element.onmouseup = function() {
				vis.mouseReleased();
			};
			window.onresize = function() {
				vis.resize();
			};
			Visualizer.prototype.focused = this;
			this.setFullscreen(this.config['fullscreen']);
			this.director.play();
			this.log.style.display = 'none';
			this.loading = LoadingState.IDLE;
		}
	} else if (!(this.replay instanceof XMLHttpRequest)) {
		this.loadParseReplay();
	}
};
Visualizer.prototype.calculateCanvasSize = function() {
	var result = {};
	if (typeof(window.innerWidth) == 'number') {
		//Non-IE
		result.width = window.innerWidth;
		result.height = window.innerHeight;
	} else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
		//IE 6+ in 'standards compliant mode'
		result.width = document.documentElement.clientWidth;
		result.height = document.documentElement.clientHeight;
	}
	var embed = (window.isFullscreenSupported
			&& !window.isFullscreenSupported())
			|| !this.config['fullscreen'];
	result.width = (this.w && embed) ? this.w : result.width;
	result.height = (this.h && embed) ? this.h : result.height;
	return result;
};
Visualizer.prototype.createCanvas = function(obj) {
	if (!obj.canvas) {
		obj.canvas = document.createElement('canvas');
	}
	if (!obj.ctx) {
		obj.ctx = obj.canvas.getContext('2d');
	}
};
Visualizer.prototype.setFullscreen = function(enable) {
	if (!window.isFullscreenSupported || window.isFullscreenSupported()) {
		if (window.setFullscreen) {
			this.config['fullscreen'] = window.setFullscreen(enable);
		} else {
			this.config['fullscreen'] = enable;
			if (enable || this.savedBody) {
				var html = document.getElementsByTagName("html")[0];
				if (enable) {
					this.container.removeChild(this.main.element);
					var tempBody = document.createElement("body");
					tempBody.style.overflow = 'hidden';
					tempBody.appendChild(this.main.element);
					this.savedBody = html.replaceChild(tempBody, document.body);
				} else if (this.savedBody) {
					document.body.removeChild(this.main.element);
					this.container.appendChild(this.main.element);
					html.replaceChild(this.savedBody, document.body);
					delete this.savedBody;
				}
			}
		}
	}
	this.resize(true);
};
Visualizer.prototype.setZoom = function(enable) {
	var oldScale = this.scale;
	this.config['zoom'] = enable;
	if (enable) {
		this.scale = ZOOM_SCALE;
	} else {
		this.scale = Math.min(10, Math.max(1, Math.min(
			(this.loc.vis.w - 2 * ZOOM_SCALE) / (this.replay.cols),
			(this.loc.vis.h - 2 * ZOOM_SCALE) / (this.replay.rows)))) | 0;
	}
	if (oldScale) {
		this.shiftX = (this.shiftX * this.scale / oldScale) | 0;
		this.shiftY = (this.shiftY * this.scale / oldScale) | 0;
	}
	this.loc.map = new Location(0, 0, this.scale * (this.replay.cols),
		this.scale * (this.replay.rows));
	this.loc.map.x = ((this.loc.vis.w - this.loc.map.w) / 2 + this.loc.vis.x) | 0;
	this.loc.map.y = ((this.loc.vis.h - this.loc.map.h) / 2 + this.loc.vis.y) | 0;
	this.map.canvas.width = this.loc.map.w;
	this.map.canvas.height = this.loc.map.h;
	this.renderMap();
	this.overlay.canvas.width = this.loc.map.w;
	this.overlay.canvas.height = this.loc.map.h;
	this.setBorder(this.config['border']);
	var borderBtn = this.btnMgr.groups['toolbar'].buttons[3];
	borderBtn.enabled = !enable;
	borderBtn.draw();
};
Visualizer.prototype.setBorder = function(enable) {
	this.config['border'] = enable;
	if (enable && !this.config['zoom']) {
		var loc = this.loc.vis;
		this.main.ctx.fillStyle = '#fff';
		this.main.ctx.fillRect(loc.x, loc.y, loc.w, loc.h);
		loc = this.loc.map;
		this.border.canvas.width = loc.w + 2 * ZOOM_SCALE;
		this.border.canvas.height = loc.h + 2 * ZOOM_SCALE;
		var ctx = this.border.ctx;
		ctx.save();
			this.imgMgr.pattern(0, ctx, 'repeat');
			ctx.translate(ZOOM_SCALE, ZOOM_SCALE);
			var m = this.loc.map;
			ctx.save();
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(m.w, 0);
				ctx.lineTo(m.w + ZOOM_SCALE, -ZOOM_SCALE);
				ctx.lineTo(-ZOOM_SCALE, -ZOOM_SCALE);
				ctx.closePath();
				ctx.fill();
			ctx.restore();
			ctx.save();
				ctx.translate(0, m.h);
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(m.w, 0);
				ctx.lineTo(m.w + ZOOM_SCALE, +ZOOM_SCALE);
				ctx.lineTo(-ZOOM_SCALE, +ZOOM_SCALE);
				ctx.closePath();
				ctx.fill();
			ctx.restore();
			ctx.rotate(0.5 * Math.PI);
			ctx.save();
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(m.h, 0);
				ctx.lineTo(m.h + ZOOM_SCALE, ZOOM_SCALE);
				ctx.lineTo(-ZOOM_SCALE, ZOOM_SCALE);
				ctx.closePath();
				ctx.fill();
			ctx.restore();
			ctx.save();
				ctx.translate(0, -m.w);
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.lineTo(m.h, 0);
				ctx.lineTo(m.h + ZOOM_SCALE, -ZOOM_SCALE);
				ctx.lineTo(-ZOOM_SCALE, -ZOOM_SCALE);
				ctx.closePath();
				ctx.fill();
		   ctx.restore();
		ctx.restore();
	} else {
		this.border.canvas.width = this.loc.map.w;
		this.border.canvas.height = this.loc.map.h;
	}
};
Visualizer.prototype.setAntLabels = function(enable) {
	this.config['label'] = enable;
};
Visualizer.prototype.resize = function(forced) {
	var olds = {
		width: this.main.element.width,
		height: this.main.element.height
	};
	var news = this.calculateCanvasSize();
	var resizing = news.width != olds.width || news.height != olds.height;
	if (resizing || forced) {
		if (resizing) {
			this.main.element.width = news.width;
			this.main.element.height = news.height;
		}
		var canvas = this.main.canvas;
		var ctx = this.main.ctx;
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		// 1. player buttons
		var y = this.btnMgr.groups['players'].cascade(news.width) + 4;
		// 2. scores bar & time line
		this.loc.graph = new Location(4, y + 66, news.width - 8, 64);
		this.loc.scorebar = new Location(95, y +  4, news.width - 4 - 95, 22);
		this.loc.countbar = new Location(95, y + 38, news.width - 4 - 95, 22);
		ctx.lineWidth = 2;
		shapeRoundedRect(ctx, 0, y, canvas.width, 30, 1, 5);
		ctx.stroke();
		shapeRoundedRect(ctx, 0, y + 34, canvas.width, 100, 1, 5);
		ctx.moveTo(0, y + 63);
		ctx.lineTo(canvas.width, y + 63);
		ctx.stroke();
		ctx.lineWidth = 1;
		ctx.fillStyle = '#888';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.font = 'bold 20px Arial';
		ctx.fillText('scores', 4, y + 15);
		ctx.fillText('# of ants', 4, y + 49);
		y += 134;
		// 3. visualizer placement
		this.loc.vis = new Location(LEFT_PANEL_W, y,
			news.width - LEFT_PANEL_W - RIGHT_PANEL_W,
			news.height - y - BOTTOM_PANEL_H);
		var bg = this.btnMgr.groups['playback'];
		bg.x = ((news.width - 8 * 64) / 2) | 0;
		bg.y = this.loc.vis.y + this.loc.vis.h;
		bg = this.btnMgr.groups['fog'];
		bg.y = this.loc.vis.y + 8;
		bg = this.btnMgr.groups['toolbar'];
		bg.x = this.loc.vis.x + this.loc.vis.w;
		bg.y = this.loc.vis.y + 8;
		this.setZoom(this.config['zoom']);
		this.setBorder(this.config['border']);
		this.scores.canvas.width = this.loc.graph.w;
		this.scores.canvas.height = this.loc.graph.h;
		this.renderCounts();
		// redraw everything
		this.btnMgr.draw();
		this.director.draw();
	}
};
/**
 * @private
 */
Visualizer.prototype.renderMap = function() {
	var ctx = this.map.ctx;
	ctx.fillStyle = COLOR_SAND;
	ctx.fillRect(0, 0, this.loc.map.w, this.loc.map.h);
	ctx.fillStyle = COLOR_WATER;
	for (var row = 0; row < this.replay.rows; row++) {
		var start = undefined;
		for (var col = 0; col < this.replay.cols; col++) {
			var isWall = this.replay.walls[row][col];
			if (start === undefined && isWall) {
				start = col;
			} else if (start !== undefined && !isWall) {
				ctx.fillRect(this.scale * start, this.scale * row, this.scale * (col - start), this.scale);
				start = undefined;
			}
		}
		if (start !== undefined) {
			ctx.fillRect(this.scale * start, this.scale * row, this.scale * (col - start), this.scale);
		}
	}
};
/**
 * @private
 */
Visualizer.prototype.renderCounts = function() {
	var ctx = this.scores.ctx;
	var w = this.scores.canvas.width - 1;
	var h = this.scores.canvas.height - 1;
	ctx.fillStyle = '#FFF';
	ctx.fillRect(0, 0, w + 1, h + 1);
	// find lowest and highest value
	var min = 0;
	var max = -Infinity;
	for (var i = 0; i <= this.replay.duration; i++) {
		for (var k = 0; k < this.replay.counts[i].length; k++) {
			if (max < this.replay.counts[i][k]) {
				max = this.replay.counts[i][k];
			}
		}
	}
	// draw lines
	var scaleX = w / (this.replay.turns.length - 1);
	ctx.strokeStyle = 'rgba(0,0,0,0.5)';
	ctx.beginPath();
	for (i = 0; i <= this.replay.turns.length; i++) {
		var t = i + 1;
		ctx.moveTo(0.5 + scaleX * i, h - (t % 100 ? t % 10 ? 3 : 7 : 17));
		ctx.lineTo(0.5 + scaleX * i, h + 1);
	}
	ctx.moveTo(0.5 + 0, h + 0.5);
	ctx.lineTo(0.5 + scaleX * this.replay.turns.length, h + 0.5);
	ctx.stroke();
	var scaleY = h / (max - min);
	for (i = this.replay.players - 1; i >= 0; i--) {
		ctx.strokeStyle = this.replay.htmlPlayerColors[i];
		ctx.beginPath();
		ctx.moveTo(0.5, 0.5 + scaleY * (max - this.replay.counts[0][i]));
		for (k = 1; k <= this.replay.duration; k++) {
			ctx.lineTo(0.5 + scaleX * k, 0.5 + scaleY * (max - this.replay.counts[k][i]));
		}
		ctx.stroke();
	}
};
/**
 * @private
 */
Visualizer.prototype.renderFog = function(turn) {
	var useOverlay = !this.config['border'] || this.config['zoom']
	if (useOverlay) {
		var ctx = this.overlay.ctx;
	} else {
		ctx = this.border.ctx;
		ctx.save();
		ctx.translate(ZOOM_SCALE, ZOOM_SCALE);
	}
	ctx.clearRect(0, 0, this.overlay.canvas.width, this.overlay.canvas.height);
	if (this.fog) {
		if (!this.fog.ctx) {
			this.createCanvas(this.fog);
			this.fog.canvas.width = 2;
			this.fog.canvas.height = 2;
			this.fog.ctx.fillStyle = this.replay.htmlPlayerColors[this.fog.player];
			this.fog.ctx.fillRect(0, 0, 1, 1);
			this.fog.ctx.fillRect(1, 1, 1, 1);
			this.fog.ptrn = ctx.createPattern(this.fog.canvas, 'repeat');
		}
		ctx.fillStyle = this.fog.ptrn;
		var fog = this.replay.getFog(this.fog.player, turn);
		for (var row = 0; row < this.replay.rows; row++) {
			var fogRow = fog[row];
			var y = row * this.scale;
			var start = undefined;
			for (var col = 0; col < this.replay.cols; col++) {
				var x = col * this.scale;
				var isFog = fogRow[col];
				if (start === undefined && isFog) {
					start = x;
				} else if (start !== undefined && !isFog) {
					ctx.fillRect(start, y, x - start, this.scale);
					start = undefined;
				}
			}
			if (start !== undefined) {
				ctx.fillRect(start, y, this.replay.cols * this.scale - start, this.scale);
			}
		}
	}
	if (!useOverlay) {
		ctx.restore();
	}
};
Visualizer.prototype.showFog = function(fog) {
	if (fog === undefined) {
		this.fog = undefined;
		this.renderFog(this.director.position | 0);
	} else {
		this.fog = {player: fog};
	}
	this.director.draw();
};
/**
 * @private
 */
Visualizer.prototype.drawColorBar = function(loc, values) {
	var sum = 0;
	this.main.ctx.save();
	this.main.ctx.beginPath();
	this.main.ctx.rect(loc.x, loc.y, loc.w, loc.h);
	this.main.ctx.clip();
	for (var i = 0; i < values.length; i++) {
		sum += values[i];
	}
	var useValues = values;
	if (sum == 0) {
		useValues = new Array(values.length);
		for (i = 0; i < values.length; i++) {
			useValues[i] = 1;
		}
		sum = values.length;
	}
	var scale = loc.w / sum;
	var offsetX = loc.x;
	for (i = 0; i < useValues.length; i++) {
		var amount = scale * useValues[i];
		this.main.ctx.fillStyle = this.replay.htmlPlayerColors[i];
		this.main.ctx.fillRect(offsetX, loc.y, loc.w - offsetX + loc.x, loc.h);
		offsetX += amount;
	}
	this.main.ctx.textAlign = 'left';
	this.main.ctx.textBaseline = 'middle';
	this.main.ctx.font = 'bold 16px Monospace';
	this.main.ctx.fillStyle = 'rgba(0,0,0,0.5)';
	var offsetY = loc.y + 0.5 * loc.h;
	offsetX = loc.x + 2;
	for (i = 0; i < useValues.length; i++) {
		var text = Math.round(values[i]);
		if (this.config['label']) {
			text = String.fromCharCode(65 + i) + ':' + text;
		}
		var textWidth = this.main.ctx.measureText(text).width;
		if (useValues[i] != 0 && scale * useValues[i] >= textWidth) {
			this.main.ctx.fillText(text, offsetX, offsetY);
		}
		offsetX += scale * useValues[i];
	}
	this.main.ctx.restore();
};
/**
 * @private
 */
Visualizer.prototype.interpolate = function(array1, array2, delta) {
	if (delta === 0) return array1;
	var result = new Array(array1.length);
	for (var i = 0; i < result.length; i++) {
		result[i] = (1.0 - delta) * array1[i] + delta * array2[i];
	}
	return result;
};
/**
 * @private
 */
Visualizer.prototype.draw = function(time, tick) {
	var x, y, w, h, dx, dy, d, hash, ants, ant;
	var turn = (time | 0);
	// draw scores
	w = this.main.canvas.width;
	if (tick !== undefined) {
		if (this.fog !== undefined) this.renderFog(turn);
		this.drawColorBar(this.loc.scorebar, this.replay.scores[turn]);
		this.drawColorBar(this.loc.countbar, this.replay.counts[turn]);
	}
	this.main.ctx.drawImage(this.scores.canvas, this.loc.graph.x, this.loc.graph.y);
	// time indicator
	var duration = this.replay.turns.length - 1;
	x = this.loc.graph.x + 0.5 + (this.loc.graph.w - 1) * time / duration;
	this.main.ctx.lineWidth = 1;
	this.main.ctx.beginPath();
	this.main.ctx.moveTo(x, this.loc.graph.y + 0.5);
	this.main.ctx.lineTo(x, this.loc.graph.y + this.loc.graph.h - 0.5);
	this.main.ctx.stroke();
	// turn number
	this.main.ctx.fillStyle = '#888';
	this.main.ctx.textBaseline = 'middle';
	this.main.ctx.fillText('# of ants | ' + (turn === duration ?
			'end' : 'turn ' + (turn + 1) + '/' + duration),
			this.loc.graph.x, this.loc.graph.y + 11);
	// ants...
	var drawStates = {};
	ants = this.replay.getTurn(turn);
	for (var i = ants.length - 1; i >= 0; i--) {
		if ((ant = ants[i].interpolate(time, Quality.LOW))) {
			hash = INT_TO_HEX[ant['r']] + INT_TO_HEX[ant['g']] + INT_TO_HEX[ant['b']];
			if (!drawStates[hash]) drawStates[hash] = [];
			drawStates[hash].push(ant);
		}
	}
	if (this.config['border'] && !this.config['zoom']) {
		var ctx = this.main.ctx;
		ctx.save();
		ctx.translate(this.loc.map.x, this.loc.map.y);
	} else {
		ctx = this.border.ctx;
	}
	// draw the map background
	ctx.drawImage(this.map.canvas, 0, 0);
	// sorting by render state gives slight fps improvements
	var rowPixels = this.scale * this.replay.rows;
	var colPixels = this.scale * this.replay.cols;
	var halfScale = 0.5 * this.scale;
	for (var key in drawStates) {
		ctx.fillStyle = '#' + key;
		var drawList = drawStates[key];
		for (var n = 0; n < drawList.length; n++) {
			ant = drawList[n];
			if (this.config['graphics']) {
				this.main.ctx.save();
				this.main.ctx.globalAlpha = ant.alpha;
				x = ZOOM_SCALE * (ant.x + 0.5);
				y = ZOOM_SCALE * (ant.y + 0.5);
				this.main.ctx.translate(x, y);
				this.main.ctx.rotate(ant.angle + Math.sin(20 * time) * ant.jitter);
				this.main.ctx.drawImage(this.imgMgr.ants[ant.type], -10, -10);
				this.main.ctx.restore();
				x += 3 * Math.tan(2 * (Math.random() - 0.5));
				y += 3 * Math.tan(2 * (Math.random() - 0.5));
				if (ant.alpha == 1) {
					var sin = -Math.sin(ant.angle);
					var cos = +Math.cos(ant.angle);
					this.ctxMap.moveTo(x - sin, y - cos);
					this.ctxMap.lineTo(x + sin, y + cos);
				}
			} else {
				x = Math.round(this.scale * ant['x']);
				y = Math.round(this.scale * ant['y']);
				// correct coordinates
				x -= Math.floor(x / colPixels) * colPixels;
				y -= Math.floor(y / rowPixels) * rowPixels;
				if (ant['owner'] === undefined) {
					w = halfScale;
					if (ant['size'] !== 1) w *= ant['size'];
					ctx.beginPath();
					ctx.arc(x + halfScale, y + halfScale, w, 0, 2 * Math.PI, false);
					ctx.fill();
				} else {
					w = this.scale;
					if (ant['size'] !== 1) {
						d = 0.5 * (1.0 - ant['size']) * this.scale;
						x += d;
						y += d;
						w *= ant['size'];
					}
					ctx.fillRect(x, y, w, w);
					if (x + w > this.loc.map.w) {
						ctx.fillRect(x - this.loc.map.w, y, w, w);
						if (y + w > this.loc.map.h) {
							ctx.fillRect(x - this.loc.map.w, y - this.loc.map.h, w, w);
						}
					}
					if (y + w > this.loc.map.h) {
						ctx.fillRect(x, y - this.loc.map.h, w, w);
					}
				}
			}
		}
	}
	if (this.config['label']) {
		var fontSize = Math.max(this.scale, 8);
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = 'bold ' + fontSize + 'px Arial';
		ctx.fillStyle = '#000';
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 0.2 * fontSize;
		for (key in drawStates) {
			drawList = drawStates[key];
			for (n = 0; n < drawList.length; n++) {
				ant = drawList[n];
				x = Math.round(this.scale * ant['x']);
				y = Math.round(this.scale * ant['y']);
				// correct coordinates
				x += halfScale - Math.floor(x / colPixels) * colPixels;
				y += halfScale - Math.floor(y / rowPixels) * rowPixels;
				if (ant['owner'] !== undefined) {
					var letter = String.fromCharCode(65 + ant['owner']);
					ctx.strokeText(letter, x, y);
					ctx.fillText(letter, x, y);
					if (x - halfScale + w > this.loc.map.w) {
						ctx.strokeText(letter, x - this.loc.map.w, y);
						ctx.fillText(letter, x - this.loc.map.w, y);
						if (y - halfScale + w > this.loc.map.h) {
							ctx.strokeText(letter, x - this.loc.map.w, y - this.loc.map.h);
							ctx.fillText(letter, x - this.loc.map.w, y - this.loc.map.h);
						}
					}
					if (y - halfScale + w > this.loc.map.h) {
						ctx.strokeText(letter, x, y - this.loc.map.h);
						ctx.fillText(letter, x, y - this.loc.map.h);
					}
				}
			}
		}
	}
	if (this.config['border'] && !this.config['zoom']) {
		// draw border over ants, that moved out of the map
		ctx.drawImage(this.border.canvas, -ZOOM_SCALE, -ZOOM_SCALE);
		ctx.restore();
	} else {
		if (this.fog) ctx.drawImage(this.overlay.canvas, 0, 0);
		ctx = this.main.ctx;
		var loc = this.loc.vis;
		ctx.save();
		ctx.beginPath();
		ctx.rect(loc.x, loc.y, loc.w, loc.h);
		ctx.clip();
		var sx = this.loc.map.x - loc.x + this.shiftX;
		var sy = this.loc.map.y - loc.y + this.shiftY;
		sx += loc.x - Math.ceil(sx / this.loc.map.w) * this.loc.map.w;
		sy += loc.y - Math.ceil(sy / this.loc.map.h) * this.loc.map.h;
		for (y = sy; y < loc.y + loc.h; y += this.loc.map.h) {
			for (x = sx; x < loc.x + loc.w; x += this.loc.map.w) {
				ctx.drawImage(this.border.canvas, x, y);
			}
		}
		ctx.restore();
		ctx.fillStyle = 'rgba(0,0,0,0.5)';
		w = this.loc.map.y - loc.y;
		if (w > 0) ctx.fillRect(loc.x, loc.y, loc.w, w);
		w = loc.y + loc.h - this.loc.map.y - this.loc.map.h;
		if (w > 0) ctx.fillRect(loc.x, this.loc.map.y + this.loc.map.h, loc.w, w);
		w = this.loc.map.x - loc.x;
		if (w > 0) ctx.fillRect(loc.x, loc.y, w, loc.h);
		w = loc.x + loc.w - this.loc.map.x - this.loc.map.w;
		if (w > 0) ctx.fillRect(this.loc.map.x + this.loc.map.w, loc.y, w, loc.h);
		if (this.config['zoom']) {
			ctx.save();
			ctx.fillStyle = '#000';
			ctx.lineWidth = 2;
			ctx.beginPath();
			w = this.replay.cols;
			h = this.replay.rows;
			x = this.loc.vis.x + this.loc.vis.w - w - 2;
			y = this.loc.vis.y + 2;
			ctx.rect(x - 1, y - 1, w + 2, h + 2);
			ctx.stroke();
			ctx.globalAlpha = 0.5;
			ctx.drawImage(this.border.canvas, x, y, w, h);
			ctx.beginPath();
			ctx.rect(x, y, w, h);
			ctx.clip();
			w = this.loc.vis.w / this.scale;
			h = this.loc.vis.h / this.scale;
			dx = this.replay.cols / 2 - this.shiftX / this.scale - w / 2;
			dy = this.replay.rows / 2 - this.shiftY / this.scale - h / 2;
			dx -= Math.floor(dx / this.replay.cols) * this.replay.cols;
			dy -= Math.floor(dy / this.replay.rows) * this.replay.rows;
			ctx.beginPath();
			ctx.rect(x + dx, y + dy, w, h);
			ctx.rect(x + dx - this.replay.cols, y + dy, w, h);
			ctx.rect(x + dx, y + dy - this.replay.rows, w, h);
			ctx.rect(x + dx - this.replay.cols, y + dy - this.replay.rows, w, h);
			ctx.stroke();
			ctx.restore();
		}
	}
};
Visualizer.prototype.mouseMoved = function(mx, my) {
	var deltaX = mx - this.mouseX;
	var deltaY = my - this.mouseY;
	this.mouseX = mx;
	this.mouseY = my;
	if (this.mouseDown === 1) {
		mx = (this.mouseX - this.loc.graph.x) / (this.loc.graph.w - 1);
		mx = Math.round(mx * (this.replay.turns.length - 1));
		this.director.gotoTick(mx);
	} else if (this.mouseDown === 2 && (!this.config['border'] || this.config['zoom'])) {
		this.shiftX += deltaX;
		this.shiftY += deltaY;
		this.director.draw();
	} else {
		this.btnMgr.mouseMove(mx, my);
	}
};
Visualizer.prototype.mousePressed = function() {
	if (this.loc.graph.contains(this.mouseX, this.mouseY)) {
		this.mouseDown = 1;
	} else {
		var miniMap = new Location(this.loc.vis.x + this.loc.vis.w - this.replay.cols - 2, this.loc.vis.y + 2, this.replay.cols, this.replay.rows);
		if (this.config['zoom'] && miniMap.contains(this.mouseX, this.mouseY)) {
			this.shiftX = (this.replay.cols / 2 - (this.mouseX - miniMap.x)) * this.scale;
			this.shiftY = (this.replay.rows / 2 - (this.mouseY - miniMap.y)) * this.scale;
			this.director.draw();
		} else if (this.loc.vis.contains(this.mouseX, this.mouseY) && (!this.config['border'] || this.config['zoom'])) {
			this.mouseDown = 2;
		} else {
			this.btnMgr.mouseDown();
			return;
		}
	}
	this.mouseMoved(this.mouseX, this.mouseY);
};
Visualizer.prototype.mouseReleased = function() {
	this.mouseDown = 0;
	this.btnMgr.mouseUp();
};
Visualizer.prototype.mouseExited = function() {
	this.btnMgr.mouseMove(-1, -1);
	this.btnMgr.mouseUp();
	this.mouseDown = 0;
};
Visualizer.prototype.keyPressed = function(key) {
	var d = this.director;
	switch (key) {
		case Key.SPACE:
			d.playStop();
			break;
		case Key.LEFT:
			d.gotoTick(Math.ceil(d.position) - 1);
			break;
		case Key.RIGHT:
			d.gotoTick(Math.floor(d.position) + 1);
			break;
		case Key.PGUP:
			d.gotoTick(Math.ceil(d.position) - 10);
			break;
		case Key.PGDOWN:
			d.gotoTick(Math.floor(d.position) + 10);
			break;
		case Key.HOME:
			d.gotoTick(0);
			break;
		case Key.END:
			d.gotoTick(d.duration);
			break;
		default:
			switch (String.fromCharCode(key)) {
				case 'F':
					this.setFullscreen(!this.config['fullscreen']);
					break;
			}
	}
};
Visualizer.prototype.keyReleased = function() {
};

// make some exported functions known to Closure Compiler
Visualizer.prototype['loadReplayData'] = Visualizer.prototype.loadReplayData;
Visualizer.prototype['loadReplayDataFromPHP'] = Visualizer.prototype.loadReplayDataFromPHP;
Visualizer.prototype['loadReplayDataFromURI'] = Visualizer.prototype.loadReplayDataFromURI;