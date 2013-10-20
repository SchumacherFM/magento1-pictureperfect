/**
 * Copyright (c) 2009 Sinisa Drpa. http://www.tagtaxa.com/projects/tagtip/index.php
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR
 * ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH
 * THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * Heavily Modified by Cyrill at Schumacher dot fm 2013
 */
/*global Element,$H,$,$$,Class*/
var Tagtip = Class.create({
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
        this.shown = false;
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

        this.buildTip();
        this.addObservers();
    },

    buildTip: function () {
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

    addObservers: function () {
        this.trigger.observe(this.showTrigger, this.showMenu.bindAsEventListener(this));
        this.trigger.observe(this.hideTrigger, this.hideMenu.bindAsEventListener(this));
    },

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

    hideMenu: function (event) {
        this.container.hide();
        return false;
    },

    setContent: function (text) {
        this.content.update(text);
    }
});
