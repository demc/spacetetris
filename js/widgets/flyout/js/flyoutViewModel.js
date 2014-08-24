define(['lib/knockout-2.2.1', 'widgets/flyout/js/paneViewModel'], function (ko, PaneViewModel) {
    return function viewModel(selector) {
        var self = this,
            root = document.querySelector(selector);

		this.visible = ko.observable(false);
		this.panes = {};
		this.selectedPane = ko.observable(new PaneViewModel());

		this.width = ko.observable(window.innerWidth);
		this.dismissListeners = ko.observableArray([]);

		this.bodyStyle = ko.computed(function () {
			var width = self.width(),
				style = null;

			if (width > 960) {
				style = 'flyout-content-body-full';
			}
			else if (width > 720) {
				style = 'flyout-content-body-filled';
			}
			else {
				style = 'flyout-content-body-snapped';
			}

			return style;
		});

        //
        // Public Methods
        //

		this.addButton = function (label, click, icon) {
		    self.selectedPane.addButton(label, click, icon);
		};

		this.createPane = function (paneName, title, message, buttons) {
		    self.panes[paneName] = new PaneViewModel(title, message, buttons);
		};

		this.addDismissListener = function (f, p) {
		    f._persist = p;
		    self.dismissListeners.push(f);
		};

		this.handleBlurClick = function () {
			if (this.selectedPane().dismissible() && this.visible()) {
				this.hide();
			}
		};  

		this.show = function () {
		    if (root && getComputedStyle(root).getPropertyValue('visibility') === 'hidden') {
		        root.style.visibility = ''; 
		    }

			this.visible(true);
		};

		this.hide = function () {
		    this.visible(false);
		    fireDismissListeners();
		    cleanup();
		};

		this.reset = function () {
		    cleanup();
		};

        //
        // Private Methods
        //

		function fireDismissListeners() {
		    var persisted = [];

		    self.dismissListeners().forEach(function (f) {
		        f(self);

		        if (f._persist) {
		            persisted.push(f);
		        }
		    });

		    self.dismissListeners(persisted);
		}

		function cleanup() {
            // With panes, this makes very little sense
		    //self.title('');
		    //self.message('');
		    //self.buttons.removeAll();
		}

        //
        // Event listeners
        //

		window.addEventListener('resize', function (e) {
		    self.width(window.innerWidth);
		});
	}
});