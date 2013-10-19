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
 */

var Tagtip = Class.create({
    initialize: function (trigger, content, options) {
        this.options = $H({
            ajax: null,
            ajaxRefresh: true,
            align: 'topMiddle',
            hideDelay: .5,
            hideTrigger: 'mouseout',
            offsetx: 0,
            offsety: 8,
            parent: null,
            showDelay: .5,
            showTrigger: 'mouseover',
            style: 'default',
            target: null,
            title: null
        });
        this.options.update(options);

        this.ajax = this.options.get('ajax');
        this.ajaxRefresh = this.options.get('ajaxRefresh');
        this.align = this.options.get('align');
        this.appearEffect = null;
        this.container = null;
        this.hideEffect = null;
        this.hideDelay = this.options.get('hideDelay') * 1000;
        this.hideDelayTimer = null;
        this.hideTrigger = this.options.get('hideTrigger');
        this.offsetx = this.options.get('offsetx');
        this.offsety = this.options.get('offsety');
        this.parent = this.options.get('parent');
        this.showDelay = this.options.get('showDelay') * 1000;
        this.showDelayTimer = null;
        this.shown = false;
        this.showTrigger = this.options.get('showTrigger');
        this.style = this.options.get('style');
        this.target = this.options.get('target');

        if ($(content) != undefined)
            this.text = $(content).innerHTML;
        else
            this.text = content;
        this.tipFetched = false; // is tip content already fetched via ajax
        this.title = this.options.get('title');
        this.trigger = $(trigger);

        this.buildTip();
        this.addObservers();
    },

    buildTip: function () {
        container = new Element('div', { 'class': 'tagtip ' + this.style });
        content = new Element('div', { 'class': 'content' });

        if (this.title) {
            title = new Element('div', { 'class': 'title' });
            title.update(this.title);
            container.insert(title);
        }

        container.insert(content);
        if (this.parent)
            $(this.parent).insert(container);
        else
            document.body.insert(container);

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
        this.trigger.observe(this.showTrigger, this.showDelayed.bindAsEventListener(this, "trigger"));
        this.trigger.observe(this.hideTrigger, this.hideDelayed.bindAsEventListener(this));
        this.container.observe(this.showTrigger, this.showDelayed.bindAsEventListener(this));
        this.container.observe(this.hideTrigger, this.hideDelayed.bindAsEventListener(this));
    },

    showDelayed: function (event, whoCalled) {
        if (this.hideDelayTimer) clearTimeout(this.hideDelayTimer);
        clearTimeout(this.showDelayTimer);
        if (this.shown) {
            if (whoCalled == "trigger")
                this.hideDelayed();
        } else
            this.showDelayTimer = setTimeout(this.showMenu.bind(this), this.showDelay);
    },

    showMenu: function (event) {
        if (this.hideEffect)
            this.hideEffect.cancel();

        // reset position
        this.container.setStyle({
            position: "absolute",
            display: 'block'
        });

        // set target
        if (this.target) target = this.target;
        else target = this.trigger;

        // align
        if (this.align == 'topLeft') {
            tipPosX = 0;
            tipPosY = -(this.container.getHeight() + this.offsety);
        }
        if (this.align == 'topMiddle') {
            tipPosX = this.trigger.getWidth() / 2 - this.container.getWidth() / 2;
            tipPosY = -(this.container.getHeight() + this.offsety);
        }
        if (this.align == 'topRight') {
            tipPosX = this.trigger.getWidth() / 2 - this.container.getWidth() / 2 + (this.trigger.getWidth() / 2 - this.container.getWidth() / 2);
            tipPosY = -(this.container.getHeight() + this.offsety);
        }
        if (this.align == 'rightTop') {
            tipPosX = this.trigger.getWidth() + this.offsetx;
            tipPosY = this.trigger.getHeight() / 2 - this.container.getHeight() / 2 - (this.trigger.getHeight() / 2 - this.container.getHeight() / 2);
        }
        if (this.align == 'rightMiddle') {
            tipPosX = this.trigger.getWidth() + this.offsetx;
            tipPosY = this.trigger.getHeight() / 2 - this.container.getHeight() / 2;
        }
        if (this.align == 'rightBottom') {
            tipPosX = this.trigger.getWidth() + this.offsetx;
            tipPosY = this.trigger.getHeight() / 2 - this.container.getHeight() / 2 + (this.trigger.getHeight() / 2 - this.container.getHeight() / 2);
        }
        if (this.align == 'bottomLeft') {
            tipPosX = 0 + this.offsetx;
            tipPosY = this.trigger.getHeight() + this.offsety;
        }
        if (this.align == 'bottomMiddle') {
            tipPosX = this.trigger.getWidth() / 2 - this.container.getWidth() / 2 + this.offsetx;
            tipPosY = this.trigger.getHeight() + this.offsety;
        }
        if (this.align == 'bottomRight') {
            tipPosX = this.trigger.getWidth() / 2 - this.container.getWidth() / 2 + (this.trigger.getWidth() / 2 - this.container.getWidth() / 2);
            tipPosY = this.trigger.getHeight() + this.offsety;
        }
        if (this.align == 'leftTop') {
            tipPosX = -this.container.getWidth() + this.offsetx;
            tipPosY = this.trigger.getHeight() / 2 - this.container.getHeight() / 2 - (this.trigger.getHeight() / 2 - this.container.getHeight() / 2);
        }
        if (this.align == 'leftMiddle') {
            tipPosX = -this.container.getWidth() + this.offsetx;
            tipPosY = this.trigger.getHeight() / 2 - this.container.getHeight() / 2;
        }
        if (this.align == 'leftBottom') {
            tipPosX = -this.container.getWidth() + this.offsetx;
            tipPosY = this.trigger.getHeight() / 2 - this.container.getHeight() / 2 + (this.trigger.getHeight() / 2 - this.container.getHeight() / 2);
        }

        this.container.clonePosition(target, {
            setWidth: false,
            setHeight: false,
            offsetLeft: tipPosX,
            offsetTop: tipPosY
        });

        this.appearEffect = new Effect.Appear(this.container, {
            duration: 0,
            from: 0,
            to: 1.0,
            transition: Effect.Transitions.sinoidal,
            queue: {scope: 'fadeovers', position: 'end'},
            afterFinish: function () {
                this.beingShown = false;
                this.shown = true;
                // Here different things when tip is shown, ajax content, etc.
                if (this.ajax && !this.tipFetched)
                    this.getContent();
                this.trigger.fire("tagtip:shown", { tipid: this.container.identify() });
            }.bind(this)
        });
        return false;
    },

    hideMenu: function (event) {
        if (this.appearEffect)
            this.appearEffect.cancel();
        this.hideDelayTimer = null;
        this.hideEffect = Effect.DropOut(this.container, {
            afterFinish: function () {
                this.shown = false;
                this.trigger.fire("tagtip:hidden", { tipid: this.container.identify() });
            }.bind(this)
        });
        return false;
    },

    hideDelayed: function (event) {
        clearTimeout(this.showDelayTimer);
        if (this.hideDelayTimer) clearTimeout(this.hideDelayTimer);
        this.hideDelayTimer = setTimeout(this.hideMenu.bind(this), this.hideDelay);
    },

    setContent: function (text) {
        this.content.update(text);
    },

    getContent: function () {
        new Ajax.Request(this.ajax.url, {
                method: this.ajax.method,
                parameters: this.ajax.parameters,
                onCreate: function () {
                    this.content.update('...');
                }.bind(this),
                onComplete: this.ajax.onComplete,
                onSuccess: function (transport) {
                    this.content.update(transport.responseText);
                    if (!this.ajaxRefresh)
                        this.tipFetched = true;
                }.bind(this)
            }
        );
    }
});
