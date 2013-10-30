/**
 * @category    SchumacherFM_PicturePerfect
 * @package     JavaScript
 * @author      Cyrill at Schumacher dot fm / @SchumacherFM
 * @copyright   Copyright (c)
 */
/*global $,window,$$,marked,varienGlobalEvents,Ajax,FileReaderJS,Event,Element,encode_base64,Tagtip,PicturePerfectXhr*/
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
        self._tableColumnCount = 10;
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
            self._initMassActionSelect();
        };
    };

    /**
     *
     * @private
     */
    PicturePerfect.prototype._initMassActionSelect = function () {
        $('productGrid_massaction-select')
            .insert(new Element('option', {value: 'loadGalleryImages'}).update('Load Gallery Images'))
            .observe('change', function (event) {
                if (event.target.value === 'loadGalleryImages') {
                    event.preventDefault();
                    event.stopPropagation();

                    $$('input[class~="massaction-checkbox"]').each(function (element) {
                        if (true === element.checked) {
                            console.log(element.value, element.checked);
                            // @todo loadGallery images from server for previewing
                        }
                    });
                }
            });
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
     * @returns {Tagtip}
     * @private
     */
    PicturePerfect.prototype._getTagTip = function (trElement, productId) {
        var self = this,
            _tipOptions = {
                columnCount: self._tableColumnCount,
                productId: productId
            };
        return new Tagtip(trElement, 'Waiting for upload ...', _tipOptions);
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
            content += '<img src="' + image.resized + '" alt="' + image.file + '"> ';
        });

        self._tagTipCollection[currentIndex].setContent(content);
        self._tagTipCollection[currentIndex]._isInitialized = false;
        self._tagTipCollection[currentIndex].showMenu(event);
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
     * @param event
     * @returns {Number}
     * @private
     */
    PicturePerfect.prototype._getIndex = function (event) {
        var target = event.srcElement || event.target,
            row = target.parentNode,
            ri = parseInt(row.rowIndex || -1, 10),
            productId = parseInt(row.readAttribute('data-pid') || 0, 10);

        return productId > 0 && ri > -1 ? productId : false;
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
     * @param trElement current TR
     * @param productId
     * @returns {*}
     * @private
     */
    PicturePerfect.prototype._createFileReaderInstance = function (trElement, productId) {
        productId = parseInt(productId, 10);
        var
            cfriSelf = this,
            options = {},
            secondTd = trElement.select('td'),
            currentIndex = '',
            $progressElement = cfriSelf._getProgressElement();

        secondTd = secondTd[1] || {}; // used for the icons to place them in the background
        secondTd.insert($progressElement);

        if (undefined === encode_base64) {
            // @todo check for using: send(Blob) or send(ArrayBuffer)
            // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
            return console.log('FileReader not available because method encode_base64() is missing!');
        }

        if (0 === productId) {
            return console.log('productId is 0 cannot instantiate fileReader', trElement);
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
                    var index = cfriSelf._getIndex(event);

                    if (false === index) {
                        return;
                    }
                    currentIndex = index;
                    if (undefined === cfriSelf._tagTipCollection[currentIndex]) {
                        cfriSelf._tagTipCollection[currentIndex] = cfriSelf._getTagTip(trElement, productId);
                    }
                    if (false === cfriSelf._tagTipCollection[currentIndex]._isInitialized) {
                        cfriSelf._tagTipCollection[currentIndex].showMenu(event);
                    }
                },
                dragleave: function (event) {
                    if (undefined !== cfriSelf._tagTipCollection[currentIndex]) {
                        cfriSelf._tagTipCollection[currentIndex].hideMenu(event);
                    }
                },

                beforestart: function () {
                    secondTd.removeClassName('fReaderError');
                    secondTd.removeClassName('fReaderSuccess');
                    $progressElement.show();
                },
                load: function (event, file) {

                    var ajaxRequest = new PicturePerfectXhr(cfriSelf._globalConfig.uploadUrl, {
                        onSuccess: function (event, xhrObj) {
                            var response = event.srcElement || event.target,
                                result = {};

                            try {
                                result = JSON.parse(response.responseText);
                            } catch (e) {
                                return cfriSelf._handleError(secondTd, {
                                    alert: 'An error occurred. Tried to parse JSON response which could not be in JSON format.',
                                    log: ['Invalid responseText in JSON', e, response]
                                });
                            }


                            if (result && _isObject(result)) {
                                if (result.err === false) {
                                    secondTd.removeClassName('fReaderError');
                                    secondTd.addClassName('fReaderSuccess');
                                    console.debug('Upload result: ', result);
                                    cfriSelf._updateTagTip(event, file, currentIndex, result.images, productId);
                                } else {
                                    cfriSelf._handleError(secondTd, {
                                        alert: 'An error occurred:\n' + result.msg
                                    });
                                }
                            } else {
                                cfriSelf._handleError(secondTd, {
                                    alert: 'An error occurred after uploading. No JSON found ...'
                                });
                            }
                        },
                        onFailure: function () {
                            secondTd.addClassName('fReaderError');
                        }
                    });

                    ajaxRequest
                        .addUploadEvent('progress', function (event) {
                            var percentComplete = 0.00001;
                            if (event.lengthComputable) {
                                percentComplete = event.loaded / event.total;
                                cfriSelf._intervalProgress($progressElement, percentComplete);
                            }
                            // else: Unable to compute progress information since the total size is unknown
                        })
                        .addUploadEvent('loadend', function (event) {
                            $progressElement.hide();
                            $progressElement.value = 0;
                        });

                    ajaxRequest.sendPost({
                        'form_key': cfriSelf._globalConfig.form_key,
                        'productId': productId,
                        'file': JSON.stringify({
                            'name': file.name,
                            'extra': file.extra
                        }),
                        'binaryData': encode_base64(event.target.result)
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
        FileReaderJS.setupDrop(trElement, options);
    };

    var pp = new PicturePerfect();
    document.observe('dom:loaded', pp.domLoaded());

}).
    call(function () {
        return this || (typeof window !== 'undefined' ? window : global);
    }());
