/*global Element,$H,$,$$,Class*/
var Tagtip = Class.create({

    /**
     *
     * @param trigger
     * @param content
     * @param options
     */
    initialize: function (trigger, content, options) {
        this.options = $H({
            hideTrigger: 'mouseout',
            offsetx: 25,
            offsety: 0,
            columnCount: 10,
            showTrigger: 'mouseover',
            target: null,
            title: null,
            productId: 0
        });
        this.options.update(options);

        this.container = null;

        this.hideTrigger = this.options.get('hideTrigger');
        this.offsetx = this.options.get('offsetx');
        this.offsety = this.options.get('offsety');
        this.columnCount = this.options.get('columnCount');
        this.showTrigger = this.options.get('showTrigger');
        this.target = this.options.get('target');
        this.productId = this.options.get('productId');

        if ($(content) && $(content) !== null) {
            this.text = $(content).innerHTML;
        } else {
            this.text = content;
        }

        this.title = this.options.get('title');
        this.trigger = trigger;
        this._isInitialized = true;

        this._buildTip();
        this._addObservers();
    },

    _buildTip: function () {
        var
            container = new Element('tr', { 'class': 'tagtip', id: 'tip' + this.productId }),
            content = new Element('td', { 'class': 'content', colspan: this.columnCount - 1 }); // first column removed

        container.insert(new Element('td').update('&nbsp;'));
        container.insert(content);


        this.trigger.insert({after: container});

        this.container = container;
        this.content = content;

        this.container.setStyle({display: 'none'});

        if (this.text) {
            this.content.update(this.text);
        } else {
            this.content.update('');
        }
    },

    _addObservers: function () {
        this.trigger.observe(this.showTrigger, this.showMenu.bindAsEventListener(this));
        this.trigger.observe(this.hideTrigger, this.hideMenu.bindAsEventListener(this));
    },

    /**
     *
     * @param event
     * @returns {boolean}
     */
    showMenu: function (event) {
        if (this._isInitialized === true) {
            return false;
        }

        // reset position
        this.container.setStyle({
            display: 'table-row'
        });

        return false;
    },

    /**
     *
     * @param event
     * @returns {boolean}
     */
    hideMenu: function (event) {
        this.container.hide();
        return false;
    },

    /**
     *
     * @param text
     */
    setContent: function (text) {
        this.content.update(text);
    }
});
