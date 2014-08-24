(function(global) {

	function Viewport(element) {
		var self = this;

		this.element = element;
		this.height = element.innerHeight;
		this.width = element.innerWidth;

		// Try to detect WinJS. 
		this.isWin8 = !!global.Windows;

		this.resizeObserver = new ResizeObserver(element);

		this.resizeObserver.subscribe(function (e) {
			self.update();
		});
	}

	Viewport.prototype.getElement = function () {
		return this.element;
	};

	Viewport.prototype.update = function () {
		this.height = this.element.innerHeight;
		this.width = this.element.innerWidth;
	};

	/**
	 * Returns a width state approximation. 
	 */ 
	Viewport.prototype.getState = function () {
		if (this.isWin8) {
			return Windows.UI.ViewManagement.ApplicationView.value;
		}

		if (this.width < 720) {
			return 'SMALL';
		}
		else if (this.width < 960) {
			return 'MEDIUM';
		}
		else {
			return 'LARGE';
		}
	};

	Viewport.prototype.subscribe = function(fn) {
		var self = this;

		this.resizeObserver.subscribe(function (e) {
			fn.call(null, {
				state: self.getState()
			});
		});
	};

	function ResizeObserver(element) {
		var self = this;

		this.element = element;
		this.handlers = [];

		element.addEventListener('resize', function (e) { self._handleResize(e); }, false);
	}

	ResizeObserver.prototype._handleResize = function (e) {
		var i, handler;

		this.width = global.innerWidth;
		this.height = global.innerHeight;

		for (i = 0; i < this.handlers.length; i++) {
			handler = this.handlers[i];

			if (handler) {
				handler.call(null, e);
			}
		}
	};

	ResizeObserver.prototype.subscribe = function (handler) {
		this.handlers.push(handler);
	};

	global.Viewport = Viewport;

})(window); 