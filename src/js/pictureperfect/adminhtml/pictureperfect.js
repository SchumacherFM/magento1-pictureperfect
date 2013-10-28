/**
 * @category    SchumacherFM_PicturePerfect
 * @package     JavaScript
 * @author      Cyrill at Schumacher dot fm / @SchumacherFM
 * @copyright   Copyright (c)
 */
/*global $,$$,marked,varienGlobalEvents,Ajax,FileReaderJS,Event,Element,encode_base64,Tagtip*/
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
            progressUrl: _checkHttp(config.progressUrl || false),
            progressName: config.progressName || false
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
                            // @todo loadGallery images from server
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
    PicturePerfect.prototype._getProgressElement = function (productId) {
        if (false === self._globalConfig.progressUrl) {
            return false;
        }
        var progressElement = new Element('progress', {'id': 'prog' + productId, 'max': 100, 'value': 0});
//        progressElement.update('<span class="prcnt">0</span>%');
        return progressElement;
    };

    PicturePerfect.prototype._intervalProgress = function (productId) {

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
            self = this,
            options = {},
            secondTd = trElement.select('td'),
            currentIndex = '';

        secondTd = secondTd[1] || {}; // used for the icons to place them in the background

        if (undefined === encode_base64) {
            return console.log('FileReader not available because method encode_base64() is missing!');
        }

        if (0 === productId) {
            return console.log('productId is 0 cannot instantiate fileReader', trElement);
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
                ri = parseInt(row.rowIndex || -1, 10),
                productId = parseInt(row.readAttribute('data-pid') || 0, 10);

            return productId > 0 && ri > -1 ? productId : false;
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
                        self._tagTipCollection[currentIndex] = self._getTagTip(trElement, productId);
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

//                    secondTd.insert(progressElement);
                },
                load: function (event, file) {

                    var postParams = {
                        'productId': productId,
                        'file': JSON.stringify(file),
                        'binaryData': encode_base64(event.target.result)
                    };


                    var ajaxRequest = new XhrPost(self._globalConfig.uploadUrl, {
                        onSuccess: function (event, xhrObj) {

                            return console.log('success: ', event);

                            var response = {};

                            var result = JSON.parse(response.responseText);
                            if (result && _isObject(result)) {
                                if (result.err === false) {
                                    secondTd.removeClassName('fReaderError');
                                    secondTd.addClassName('fReaderSuccess');

                                    console.log('Upload result: ', result);

                                    self._updateTagTip(event, file, currentIndex, result.images, productId);
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
                        }
                    });
                    ajaxRequest.initTransport().send(postParams);
                    console.log('ajaxRequest', ajaxRequest);

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
