require(['widgets/flyout/js/flyout'], function (Flyout, Button) {
    var selector = '.flyout-wrapper',
        fly = document.querySelector(selector),
        flyoutViewModel = Flyout(fly, selector);

	GlobalFlyout = flyoutViewModel; // design likely to change to events
});