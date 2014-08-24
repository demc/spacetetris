define(['lib/knockout-2.2.1', 'widgets/flyout/js/flyoutViewModel'], function (ko, FlyoutViewModel) {
	return function (element, cfg) {
	    var viewModel = new FlyoutViewModel(cfg);
		ko.applyBindings(viewModel, element);
		return viewModel;
	}
});