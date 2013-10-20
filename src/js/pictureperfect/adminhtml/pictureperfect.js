/**
 * @category    SchumacherFM_PicturePerfect
 * @package     JavaScript
 * @author      Cyrill at Schumacher dot fm / @SchumacherFM
 * @copyright   Copyright (c)
 */
/*global $,$$,marked,varienGlobalEvents,Ajax,FileReaderJS,Event,encode_base64,Tagtip*/
;
(function () {
    'use strict';

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
     * @returns {*}
     * @constructor
     */
    function PicturePerfect() {
        var self = this;
        self._globalConfig = {};
        self._tagTipCollection = {};
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
            uploadUrl: _checkHttp(config.uploadUrl || false)
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
        };
    };

    /**
     *
     * @returns {Function}
     */
    PicturePerfect.prototype._initFileReaderOnTableRows = function () {
        var self = this;
        $$('#productGrid_table tbody tr').each(function (element, index) {
            var checkBox = element.select('.massaction-checkbox');
            self._createFileReaderInstance(element, (checkBox[0] || {value: 0}).value);
        });
    };

    /**
     *
     * @param event
     * @returns {Tagtip}
     * @private
     */
    PicturePerfect.prototype._getTagTip = function (event, productId) {
        var _tipOptions = {
            align: 'topLeft',
            title: 'Media Gallery for ID: ' + productId
        };
        return new Tagtip(event.target.parentNode, 'Waiting for upload ...', _tipOptions);
    };

    /**
     *
     * @param event {}
     * @param file {}
     * @param currentIndex int
     * @param productId int
     * @param images []
     * @returns {*}
     * @private
     */
    PicturePerfect.prototype._updateTagTip = function (event, file, currentIndex, images) {
        var self = this,
            content = '';

        content += 'Uploaded: <strong>' + file.name + ' (' + file.extra.prettySize + ')</strong><br/>';

        images.forEach(function (image, index) {
            content += '<img src="' + image.resized + '" alt="' + image.file + '"> ';
        });

        self._tagTipCollection[currentIndex].setContent(content);
        self._tagTipCollection[currentIndex]._isInitialized = false;
        self._tagTipCollection[currentIndex].showMenu(event);
        return this;
    };

    /**
     *
     * @param element
     * @param productId
     * @returns {*}
     * @private
     */
    PicturePerfect.prototype._createFileReaderInstance = function (element, productId) {
        productId = parseInt(productId, 10);
        var
            self = this,
            options = {},
            secondTd = element.select('td'),
            currentIndex = '';

        secondTd = secondTd[1] || {};

        if (undefined === encode_base64) {
            return console.log('FileReader not available because method encode_base64() is missing!');
        }

        if (0 === productId) {
            return console.log('productId is 0 cannot instantiate fileReader', element);
        }

        if (false === self._globalConfig.uploadUrl) {
            return console.log('FileReader upload url not available!');
        }

        /**
         *
         * @param event
         * @returns {string}
         * @private
         */
        function _getIndex(event) {
            var target = event.srcElement || event.target,
                row = target.parentNode,
                ri = parseInt(row.rowIndex || -1, 10);
            if (ri > -1) {
                return ri;
            }
            return false;
        }

        options = {
            dragClass: 'fReaderDrag',
            accept: 'image/*',
            readAsMap: {
                'image/*': 'BinaryString'
            },
            readAsDefault: 'BinaryString',
            on: {

                dragenter: function (event) {
                    var index = _getIndex(event);

                    if (false === index) {
                        return;
                    }
                    currentIndex = index;
                    if (undefined === self._tagTipCollection[currentIndex]) {
                        self._tagTipCollection[currentIndex] = self._getTagTip(event, productId);
                    }
                    if (false === self._tagTipCollection[currentIndex]._isInitialized) {
                        self._tagTipCollection[currentIndex].showMenu(event);
                    }
                },
                dragleave: function (event) {
                    if (undefined !== self._tagTipCollection[currentIndex]) {
                        self._tagTipCollection[currentIndex].hideMenu(event);
                    }
                },

                beforestart: function () {
                    secondTd.removeClassName('fReaderError');
                    secondTd.removeClassName('fReaderSuccess');
                    secondTd.addClassName('fReaderProgress');
                },
                load: function (event, file) {

                    var ar = new Ajax.Request(self._globalConfig.uploadUrl, {
                        onSuccess: function (response) {
                            var result = JSON.parse(response.responseText);
                            if (result && _isObject(result)) {
                                if (result.err === false) {
                                    secondTd.removeClassName('fReaderError');
                                    secondTd.addClassName('fReaderSuccess');

                                    console.log('Upload result: ', result);

                                    self._updateTagTip(event, file, currentIndex, result.images);
                                } else {
                                    alert('An error occurred:\n' + result.msg);
                                    secondTd.addClassName('fReaderError');
                                }
                            } else {
                                alert('An error occurred after uploading. No JSON found ...');
                                secondTd.addClassName('fReaderError');
                            }
                            secondTd.removeClassName('fReaderProgress');
                        },
                        onFailure: function () {
                            secondTd.addClassName('fReaderError');
                        },
                        method: 'post',
                        parameters: {
                            'productId': productId,
                            'binaryData': encode_base64(event.target.result),
                            'file': JSON.stringify(file)
                        },
                        loaderArea: false
                    });

                },
                error: function (e, file) {
                    // Native ProgressEvent
                    secondTd.addClassName('fReaderError');
                    alert('An error occurred. Please see console.log');
                    return console.log('error: ', e, file);
                },
                skip: function (e, file) {
                    secondTd.addClassName('fReaderError');
                    return console.log('File format is not supported', file);
                }
            }
        };
        FileReaderJS.setupDrop(element, options);
    };

    var pp = new PicturePerfect();
    document.observe('dom:loaded', pp.domLoaded());

}).
    call(function () {
        return this || (typeof window !== 'undefined' ? window : global);
    }());
