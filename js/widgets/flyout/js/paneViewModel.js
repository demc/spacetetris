define(['lib/knockout-2.2.1', 'widgets/flyout/js/buttonModel'], function (ko, ButtonModel) {

    return function (title, message, buttons) {
        var self = this,
            btns = [];

        for (var b in buttons) {
            btns.push(new ButtonModel(b, buttons[b]));
        }

        this.title = ko.observable(title || '');
        this.message = ko.observable(message || '');
        this.errors = ko.observableArray([]);
        this.fields = ko.observableArray([]);
        this.buttons = ko.observableArray(btns);
        this.loading = ko.observable(false);
        this.loadingMessage = ko.observable('Loading...');
        this.dismissible = ko.observable(true);

        //
        // Public Methods
        //

        this.addButton = function (label, click, icon) {
            self.buttons.push(new ButtonModel(label, click, icon));
        }

        this.addError = function (err, msg) {
            self.errors.push({ error: err, message: msg });
        };

        this.addField = function (label, type, id) {
            if (type !== 'text') throw 'Input type not supported';

            self.fields.push({ 
                label: label,
                type: type,
                id: id
            });
        }
    };
});