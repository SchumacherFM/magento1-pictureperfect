/**
 * @category    SchumacherFM_PicturePerfect
 * @package     JavaScript
 * @author      Cyrill at Schumacher dot fm / @SchumacherFM
 * @copyright   Copyright (c)
 */
/*global $,window,$$,marked,varienGlobalEvents,Ajax,FileReaderJS,Event,Element,encode_base64,PicturePerfectXhr*/
;
(function () {
    'use strict';

    var _tagTipCollection = {};

    /**
     *
     * @param str string
     * @returns boolean|string
     * @private
     */
    function _checkHttp(str) {

        if (!str || false === str || str.indexOf('http') === -1) {
            return false;
        }
        return str;
    }

    /**
     *
     * @param variable mixed
     * @returns {boolean}
     * @private
     */
    function _isObject(variable) {
        return Object.prototype.toString.call(variable) === '[object Object]';
    }

    /**
     *
     * @param variable mixed
     * @returns {boolean}
     * @private
     */
    function _isFunction(variable) {
        return Object.prototype.toString.call(variable) === '[object Function]';
    }

    /**
     *
     * @param image object
     * @returns {string}
     */
    function getTagTipTemplate(image) {
        var content = '';

        content = '<div class="ppC"><div class="img" style="background-image: url(' + image.resized + ');" title="' + image.file + '"></div>';
        if (image.label !== '') {
            content += '<div class="txt label">' + image.label + '</div>';
        }
        content += '<div class="txt">' + image.fileSizePretty + '</div><div class="txt">' + image.widthHeight + '</div>';

        content += '</div>';
        return content;
    }


    function MassActionGalleryButton(globalConfig) {
        var self = this;
        self._globalConfig = globalConfig;
        self._$progressElement = self._initProgressElement();
        self._$button = self._initMassActionButton();
        self._$button.insert(self._$progressElement);
        return this;
    }

    MassActionGalleryButton.prototype = {

        _initProgressElement: function () {
            var progressElement = new Element('progress', {
                'max': 1,
                'value': 0,
                'style': 'margin-left: 5px;'
            }); // not DRY
            progressElement.update('0%'); // for older browser ... ? ;-)
            progressElement.hide();
            return progressElement;
        },

        /**
         * this methods runs every 50ms
         * @param $progressElement Element
         * @param percentComplete float
         * @private
         */
        _intervalProgress: function (percentComplete) {
            var self = this,
                percentage = Math.round(percentComplete * 100);
            self._$progressElement.value = percentComplete;
            self._$progressElement.update(percentage + '%'); // for older browser ... ? ;-)
        },
        /**
         *
         * @private
         */
        _initMassActionButton: function () {
            var self = this,
                button = new Element('button', {
                    id: 'picturePerfectMassAction',
                    'class': 'picturePerfect'
                });
            $$('.filter-actions')[0].insert(button);

            button
                .update('Load Gallery Images')
                .observe('click', self._massEventClickLoadGalleryButton.bindAsEventListener(self));
            return button;
        },

        /**
         *
         * @param event
         * @returns {*}
         * @private
         */
        _massEventClickLoadGalleryButton: function (event) {
            event.preventDefault();
            var productIds = this._getMassActionCheckboxValues();
            if (productIds.length === 0 || this._globalConfig.galleryUrl === false) {
                alert('Please select items.');
                return console.log('Logger: ', productIds.length, this._globalConfig.galleryUrl);
            }
            this._getMassActionAjaxGalleries(productIds);
        },

        /**
         *
         * @returns {Array}
         * @private
         */
        _getMassActionCheckboxValues: function () {
            var result = [];
            $$('input[class~="massaction-checkbox"]').each(function (element) {
                if (true === element.checked) {
                    result.push(parseInt(element.value, 10));
                }
            });
            return result;
        },

        /**
         *
         * @param productIds
         * @private
         */
        _getMassActionAjaxGalleries: function (productIds) {
            var self = this,
                ar = new Ajax.Request(self._globalConfig.galleryUrl, {
                    onSuccess: self._initProductGrid.bindAsEventListener(self),
                    onFailure: function () {
                        alert('Ajax failure!');
                    },
                    method: 'post',
                    parameters: {
                        'form_key': self._globalConfig.form_key,
                        'productIds': productIds.join(',')
                    }
                });
        },

        /**
         *
         * @param ajaxResult
         * @private
         */
        _initProductGrid: function (response) {
            var jsonResponse = response.responseJSON,
                self = this,
                _tableColumnCount = 0;

            if (false !== jsonResponse.err) {
                alert(jsonResponse.msg);
                return console.error(jsonResponse);
            }


            $$('#productGrid_table tbody tr').each(function (element, index) {
                if (index === 0) {
                    _tableColumnCount = element.cells.length || 10;
                }
                var checkBox = element.select('.massaction-checkbox'),
                    productId = (checkBox[0] || {value: 0}).value,
                    images = jsonResponse.images[productId] || false;

                if (false === images) {
                    return;
                }

                if (false === element.hasAttribute('data-pid')) {
                    element.writeAttribute('data-pid', productId);
                }

                self._initTagTip(element, productId, images, _tableColumnCount);

            });
        },

        /**
         *
         * @param trElement object
         * @param productId int
         * @param images array
         * @param tableColumnCount int
         * @returns {MassActionGalleryButton}
         * @private
         */
        _initTagTip: function (trElement, productId, images, tableColumnCount) {
            var self = this, content = '';

            if (undefined === _tagTipCollection[productId]) {
                _tagTipCollection[productId] = new TagTip(trElement, 'Initializing ...', {
                    columnCount: tableColumnCount,
                    productId: productId
                });
            }

            images.forEach(function (image, index) {
                content += getTagTipTemplate(image);
            });

            _tagTipCollection[productId].setContent(content);
            _tagTipCollection[productId]._isInitialized = false;
            return this;
        }
    };

    /**
     *
     * @returns {*}
     * @constructor
     */
    function PicturePerfect() {
        var self = this;
        self._globalConfig = {};
        self._tableColumnCount = 10;
        self._currentTrIndex = 0;
        self._previousTrIndex = 0;
        return this;
    }

    /**
     *
     * @returns {*}
     */
    PicturePerfect.prototype._initConfig = function () {
        var
            self = this,
            config = JSON.parse($('picturePerfectConfig').readAttribute('data-config') || '{}');
        if (config.uploadUrl === undefined) {
            return console.log('PicturePerfect Global Config not found. General error!');
        }

        self._globalConfig = {
            uploadUrl: _checkHttp(config.uploadUrl || false),
            galleryUrl: _checkHttp(config.galleryUrl || false),
            form_key: config.form_key || false
//            reMarkedCfg: decodeURIComponent(config.rmc || '{}').evalJSON(true)
        };
        return this;
    };

    /**
     *
     * @returns {boolean}
     * @private
     */
    PicturePerfect.prototype._isFileReaderEnabled = function () {
        return window.FileReader !== undefined;
    };

    /**
     *
     * @returns {Function}
     */
    PicturePerfect.prototype.domLoaded = function () {
        var self = this;

        if (self._isFileReaderEnabled() === false) {
            return function _missingFileReader() {
                return console.log('FileReader is missing');
            };
        }

        return function ppDomLoaded() {
            self._initConfig();
            self._initFileReaderOnTableRows();
            var mag = new MassActionGalleryButton(self._globalConfig);
        };
    };

    /**
     *
     * @returns {Function}
     */
    PicturePerfect.prototype._initFileReaderOnTableRows = function () {
        var self = this;
        $$('#productGrid_table tbody tr').each(function (element, index) {
            if (index === 0) {
                self._tableColumnCount = element.cells.length || 10;
            }
            var checkBox = element.select('.massaction-checkbox'),
                productId = (checkBox[0] || {value: 0}).value;
            element.writeAttribute('data-pid', productId);
            self._createFileReaderInstance(element, productId);
        });
    };

    /**
     *
     * @param trElement
     * @returns {TagTip}
     * @private
     */
    PicturePerfect.prototype._getTagTip = function (trElement, productId) {
        var self = this,
            _tipOptions = {
                columnCount: self._tableColumnCount,
                productId: productId
            };
        return new TagTip(trElement, 'Waiting for upload ...', _tipOptions);
    };

    /**
     *
     * @param event {}
     * @param file {}
     * @param currentIndex int
     * @param productId int
     * @param images []
     * @param productId int
     * @returns {*}
     * @private
     */
    PicturePerfect.prototype._updateTagTip = function (event, file, currentIndex, images, productId) {
        var self = this,
            content = '';

        content += 'PID: ' + productId + '; Uploaded: <strong>' + file.name + ' (' + file.extra.prettySize + ')</strong><br/>';

        images.forEach(function (image, index) {
            content += getTagTipTemplate(image);
        });

        _tagTipCollection[self._currentTrIndex].setContent(content);
        _tagTipCollection[self._currentTrIndex]._isInitialized = false;
        _tagTipCollection[self._currentTrIndex].showMenu(event);
        return this;
    };

    /**
     *
     * @param productId
     * @returns {*}
     * @private
     */
    PicturePerfect.prototype._getProgressElement = function () {
        var progressElement = new Element('progress', {'max': 1, 'value': 0});
        progressElement.update('0%'); // for older browser ... ? ;-)
        progressElement.hide();
        return progressElement;
    };

    /**
     * this methods runs every 50ms
     * @param $progressElement Element
     * @param percentComplete float
     * @private
     */
    PicturePerfect.prototype._intervalProgress = function ($progressElement, percentComplete) {
        $progressElement.value = percentComplete;
        var percentage = Math.round(percentComplete * 100);
        $progressElement.update(percentage + '%'); // for older browser ... ? ;-)
    };

    /**
     *
     * @param secondTd
     * @param msgObj
     * @private
     */
    PicturePerfect.prototype._handleError = function (secondTd, msgObj) {
        var self = this;

        if (msgObj.alert) {
            alert(msgObj.alert);
        }

        secondTd.addClassName('fReaderError');

        if (msgObj.log) {
            return console.log(msgObj.log);
        } else {
            return;
        }
    };

    /**
     *
     * @param event
     * @returns {Number}
     * @private
     */
    PicturePerfect.prototype._getIndex = function (trElement, productId) {
        var ri = parseInt(trElement.rowIndex || -1, 10);
        return productId > 0 && ri > -1 ? productId : false;
    };

    /**
     *
     * @param event
     * @private
     */
    PicturePerfect.prototype._fileReaderEventDragEnter = function (event) {
        var self = this,
            trElement = (event.srcElement || event.target).parentNode,
            productId = parseInt(trElement.readAttribute('data-pid') || 0, 10),
            index = self._getIndex(trElement, productId);

        if (false === index) {
            return;
        }
        if (self._previousTrIndex !== self._currentTrIndex) {
            self._previousTrIndex = self._currentTrIndex;
        }

        self._currentTrIndex = index;

        if (undefined === _tagTipCollection[self._currentTrIndex]) {
            _tagTipCollection[self._currentTrIndex] = self._getTagTip(trElement, productId);
        }

        if (false === _tagTipCollection[self._currentTrIndex]._isInitialized) {
            _tagTipCollection[self._currentTrIndex].showMenu();
        }
    };

    /**
     * only hide the row when we leave the tr and not a td
     *
     * @param event
     * @private
     */
    PicturePerfect.prototype._fileReaderEventDragLeave = function (event) {
        var self = this;
        if (undefined !== _tagTipCollection[self._previousTrIndex] && self._previousTrIndex !== self._currentTrIndex) {
            _tagTipCollection[self._previousTrIndex].hideMenu();
        }
    };

    /**
     *
     * @param event
     * @param $secondTd element
     * @param $progressElement
     * @private
     */
    PicturePerfect.prototype._fileReaderEventBeforeStart = function (event, $secondTd, $progressElement) {
        var self = this;
        $secondTd.removeClassName('fReaderError');
        $secondTd.removeClassName('fReaderSuccess');
        $progressElement.show();

    };

    PicturePerfect.prototype._fileReaderEventLoad = function (event, file, $secondTd, $progressElement, productId) {

        var self = this,
            ajaxRequest = new PicturePerfectXhr(self._globalConfig.uploadUrl, {
                onSuccess: function (event, xhrObj) {
                    var response = event.srcElement || event.target,
                        result = {};

                    try {
                        result = JSON.parse(response.responseText);
                    } catch (e) {
                        return self._handleError($secondTd, {
                            alert: 'An error occurred. Tried to parse JSON response which could not be in JSON format.',
                            log: ['Invalid responseText in JSON', e, response]
                        });
                    }


                    if (result && _isObject(result)) {
                        if (result.err === false) {
                            $secondTd.removeClassName('fReaderError');
                            $secondTd.addClassName('fReaderSuccess');
                            console.debug('Upload result: ', result);
                            self._updateTagTip(event, file, self._currentTrIndex, result.images, productId);
                        } else {
                            self._handleError($secondTd, {
                                alert: 'An error occurred:\n' + result.msg
                            });
                        }
                    } else {
                        self._handleError($secondTd, {
                            alert: 'An error occurred after uploading. No JSON found ...'
                        });
                    }
                },
                onFailure: function () {
                    $secondTd.addClassName('fReaderError');
                }
            });

        ajaxRequest
            .addUploadEvent('progress', function (event) {
                var percentComplete = 0.00001;
                if (event.lengthComputable) {
                    percentComplete = event.loaded / event.total;
                    self._intervalProgress($progressElement, percentComplete);
                }
                // else: Unable to compute progress information since the total size is unknown
            })
            .addUploadEvent('loadend', function (event) {
                $progressElement.hide();
                $progressElement.value = 0;
            });

        ajaxRequest.sendPost({
            'form_key': self._globalConfig.form_key,
            'productId': productId,
            'file': JSON.stringify({
                'name': file.name,
                'extra': file.extra
            }),
            'binaryData': encode_base64(event.target.result)
        });
    };

    /**
     *
     * @param trElement current TR
     * @param productId
     * @returns {*}
     * @private
     */
    PicturePerfect.prototype._createFileReaderInstance = function (trElement, productId) {
        productId = parseInt(productId, 10);
        var
            cfriSelf = this,
            $secondTd = trElement.select('td'),

            $progressElement = cfriSelf._getProgressElement();

        $secondTd = $secondTd[1] || {}; // used for the icons to place them in the background
        $secondTd.insert($progressElement);

        if (undefined === encode_base64) {
            // @todo check for using: send(Blob) or send(ArrayBuffer)
            // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
            return console.log('FileReader not available because method encode_base64() is missing!');
        }

        if (0 === productId) {
            return console.log('productId is 0 cannot instantiate fileReader', trElement);
        }

        FileReaderJS.setupDrop(trElement, {
            dragClass: 'fReaderDrag',
            accept: 'image/*',
            readAsMap: {
                'image/*': 'BinaryString'
            },
            readAsDefault: 'BinaryString',
            on: {

                dragenter: cfriSelf._fileReaderEventDragEnter.bindAsEventListener(cfriSelf),
                dragleave: cfriSelf._fileReaderEventDragLeave.bindAsEventListener(cfriSelf),
                beforestart: cfriSelf._fileReaderEventBeforeStart.bindAsEventListener(cfriSelf, $secondTd, $progressElement),
                load: function (event, file) {
                    cfriSelf._fileReaderEventLoad(event, file, $secondTd, $progressElement, productId);
                },
                error: function (e, file) {
                    // Native ProgressEvent
                    $secondTd.addClassName('fReaderError');
                    alert('An error occurred. Please see console.log');
                    return console.log('error: ', e, file);
                },
                skip: function (e, file) {
                    $secondTd.addClassName('fReaderError');
                    return console.log('File format is not supported', file);
                }
            }
        });

    };

    /*global Element,$H,$,$$,Class*/
    var TagTip = Class.create({

            /**
             *
             * @param trigger
             * @param content
             * @param options
             */
            initialize: function (trigger, content, options) {
                this.options = $H({
                    columnCount: 10,
                    target: null,
                    productId: 0
                });
                this.options.update(options);
                this.container = null;
                this.columnCount = this.options.get('columnCount');

                this.target = this.options.get('target');
                this.productId = this.options.get('productId');

                if ($(content) && $(content) !== null) {
                    this.text = $(content).innerHTML;
                } else {
                    this.text = content;
                }

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
                this.trigger.observe('mouseover', this.showMenu.bindAsEventListener(this));
                this.trigger.observe('mouseout', this.hideMenu.bindAsEventListener(this));
                this.trigger.observe('dragleave', this.hideMenu.bindAsEventListener(this));
            },

            /**
             *
             * @returns {boolean}
             */
            showMenu: function () {
                if (this._isInitialized === true) {
                    return;
                }

                this.container.setStyle({
                    display: 'table-row'
                });
                return false;
            },

            /**
             *
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
        }),
        pp = new PicturePerfect();

    document.observe('dom:loaded', pp.domLoaded());

}).
    call(function () {
        return this || (typeof window !== 'undefined' ? window : global);
    }());
