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

var Tagtip = Class.create({
    initialize: function (trigger, content, options) {
        this.options = $H({
            align: 'topMiddle',
            hideTrigger: 'mouseout',
            offsetx: 25,
            offsety: 0,
            parent: null,
            showTrigger: 'mouseover',
            style: 'default',
            target: null,
            title: null
        });
        this.options.update(options);

        this.align = this.options.get('align');
        this.container = null;

        this.hideTrigger = this.options.get('hideTrigger');
        this.offsetx = this.options.get('offsetx');
        this.offsety = this.options.get('offsety');
        this.parent = this.options.get('parent');
        this.shown = false;
        this.showTrigger = this.options.get('showTrigger');
        this.style = this.options.get('style');
        this.target = this.options.get('target');

        if ($(content) && $(content) !== null) {
            this.text = $(content).innerHTML;
        } else {
            this.text = content;
        }

        this.title = this.options.get('title');
        this.trigger = $(trigger);
        this._isInitialized = true;

        this.buildTip();
        this.addObservers();
    },

    buildTip: function () {
        var container = new Element('div', { 'class': 'tagtip ' + this.style }),
            content = new Element('div', { 'class': 'content' });

        if (this.title) {
            title = new Element('div', { 'class': 'title' });
            title.update(this.title);
            container.insert(title);
        }

        container.insert(content);
        if (this.parent) {
            $(this.parent).insert(container);
        } else {
            document.body.insert(container);
        }
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
        var target = {},
            tipPosX = 0,
            tipPosY = 0;

        if (this._isInitialized === true) {
            return false;
        }

        // reset position
        this.container.setStyle({
            position: "absolute",
            display: 'block'
        });

        // set target
        if (this.target) {
            target = this.target;
        } else {
            target = this.trigger;
        }

        // align
        if (this.align === 'topLeft') {
            tipPosX = 0;
            tipPosY = -(this.container.getHeight() + this.offsety);
        }
        if (this.align === 'topMiddle') {
            tipPosX = this.trigger.getWidth() / 2 - this.container.getWidth() / 2;
            tipPosY = -(this.container.getHeight() + this.offsety);
        }
        if (this.align === 'topRight') {
            tipPosX = this.trigger.getWidth() / 2 - this.container.getWidth() / 2 + (this.trigger.getWidth() / 2 - this.container.getWidth() / 2);
            tipPosY = -(this.container.getHeight() + this.offsety);
        }
        if (this.align === 'rightTop') {
            tipPosX = this.trigger.getWidth() + this.offsetx;
            tipPosY = this.trigger.getHeight() / 2 - this.container.getHeight() / 2 - (this.trigger.getHeight() / 2 - this.container.getHeight() / 2);
        }
        if (this.align === 'rightMiddle') {
            tipPosX = this.trigger.getWidth() + this.offsetx;
            tipPosY = this.trigger.getHeight() / 2 - this.container.getHeight() / 2;
        }
        if (this.align === 'rightBottom') {
            tipPosX = this.trigger.getWidth() + this.offsetx;
            tipPosY = this.trigger.getHeight() / 2 - this.container.getHeight() / 2 + (this.trigger.getHeight() / 2 - this.container.getHeight() / 2);
        }
        if (this.align === 'bottomLeft') {
            tipPosX = 0 + this.offsetx;
            tipPosY = this.trigger.getHeight() + this.offsety;
        }
        if (this.align === 'bottomMiddle') {
            tipPosX = this.trigger.getWidth() / 2 - this.container.getWidth() / 2 + this.offsetx;
            tipPosY = this.trigger.getHeight() + this.offsety;
        }
        if (this.align === 'bottomRight') {
            tipPosX = this.trigger.getWidth() / 2 - this.container.getWidth() / 2 + (this.trigger.getWidth() / 2 - this.container.getWidth() / 2);
            tipPosY = this.trigger.getHeight() + this.offsety;
        }
        if (this.align === 'leftTop') {
            tipPosX = -this.container.getWidth() + this.offsetx;
            tipPosY = this.trigger.getHeight() / 2 - this.container.getHeight() / 2 - (this.trigger.getHeight() / 2 - this.container.getHeight() / 2);
        }
        if (this.align === 'leftMiddle') {
            tipPosX = -this.container.getWidth() + this.offsetx;
            tipPosY = this.trigger.getHeight() / 2 - this.container.getHeight() / 2;
        }
        if (this.align === 'leftBottom') {
            tipPosX = -this.container.getWidth() + this.offsetx;
            tipPosY = this.trigger.getHeight() / 2 - this.container.getHeight() / 2 + (this.trigger.getHeight() / 2 - this.container.getHeight() / 2);
        }

        this.container.clonePosition(target, {
            setWidth: false,
            setHeight: false,
            offsetLeft: tipPosX,
            offsetTop: tipPosY
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
