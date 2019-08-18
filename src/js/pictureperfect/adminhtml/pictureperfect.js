/**
 * @category    SchumacherFM_PicturePerfect
 * @package     JavaScript
 * @author      Cyrill at Schumacher dot fm / @SchumacherFM
 * @copyright   Copyright (c) Please read the EULA
 */
/*global $,window,$$,marked,varienGlobalEvents,Ajax,FileReaderJS,Event,Element,encode_base64,PicturePerfectXhr*/
;
(function () {
    'use strict';

    /**
     * Hack ...
     * @see http://jsbin.com/utuvu/1/edit for productGrid
     */
    Element.addMethods({
        $update: Element.update,
        update: function (elementArg, content) {
            var element = $(elementArg);
            element.$update(content);
            element.fire('element:update');
            return element;
        }
    });


    var _tagTipCollection = {},
        _translations = {};

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
        self._productGrid = $('productGrid');
        self._initMassActionButton();
        return this;
    }

    MassActionGalleryButton.prototype = {

        /**
         *
         * @returns {MassActionGalleryButton._productGrid}
         */
        getProductGrid: function () {
            return this._productGrid;
        },

        /**
         *
         * @private
         */
        _initMassActionButton: function () {
            var self = this,
                _initOnScroll = false;

            $$('.picturePerfectMassAction').each(function (buttonElement) {
                buttonElement.observe('click', self._massEventClickLoadGalleryButton.bindAsEventListener(self));
            });

            window.onscroll = function () {
                if (false === _initOnScroll) {
                    var btn = $$('.content-header-floating .picturePerfectMassAction');
                    if (1 === btn.length) {
                        btn[0].observe('click', self._massEventClickLoadGalleryButton.bindAsEventListener(self));
                    }
                    _initOnScroll = true;
                }
            };

            /**
             * HACK
             * http://jsbin.com/utuvu/1/edit
             * whenever someone clicks search in catalog->product->grid the grid will reload
             * via ajax and event listeners will be lost. so after an update has been done
             * we assign the new element to the property that the click even can work
             * still buggy ...
             * @todo 06.02. check again for errors see all element:update code pieces
             * @todo create config option to use filename as label
             */
            self._productGrid.observe('element:update', function (event) {
                var target = event.srcElement || event.target;
                if ('productGrid' === target.id) {
                    self._productGrid = target;
                    _tagTipCollection = {};
                }
            });

            return this;
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
            var self = this, result = [];
            self._productGrid.select('input[class~="massaction-checkbox"]').each(function (element) {
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

            self._productGrid.select('#productGrid_table tbody tr').each(function (element, index) {

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
     * @thinkAbout http://css-tricks.com/html5-meter-element/
     * @returns {ProgressElement}
     * @constructor
     */
    function ProgressElement(numOfSteps) {
        this._requestName = null;
        this._$innerDiv = new Element('div', {
            'style': 'background-color: ' + this._getColor(50, numOfSteps)
        });
        this._$innerDiv.update('<div>&nbsp;0%</div>');
        this._progressElement = new Element('div', {
            'class': 'ppC-progressbar '
        });
        this._progressElement.insert(this._$innerDiv);
        return this;
    }

    ProgressElement.prototype = {

        _getColor: function (numOfSteps, step) {
            //            return ('#' + ((1 << 24) * Math.random() | 0).toString(16));
            // @see http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript
            // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
            // Adam Cole, 2011-Sept-14
            // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
            var
                r, g, b,
                h = step / numOfSteps,
                i = ~~(h * 6),
                f = h * 6 - i,
                q = 1 - f;
            switch (i % 6) {
                case 0:
                    r = 1, g = f, b = 0;
                    break;
                case 1:
                    r = q, g = 1, b = 0;
                    break;
                case 2:
                    r = 0, g = 1, b = f;
                    break;
                case 3:
                    r = 0, g = q, b = 1;
                    break;
                case 4:
                    r = f, g = 0, b = 1;
                    break;
                case 5:
                    r = 1, g = 0, b = q;
                    break;
            }
            var c = "#" + ("00" + (~~(r * 255)).toString(16)).slice(-2) + ("00" + (~~(g * 255)).toString(16)).slice(-2) + ("00" + (~~(b * 255)).toString(16)).slice(-2);
            return (c);
        },
        getElement: function () {
            return this._progressElement;
        },
        show: function () {
            this._progressElement.setStyle({display: 'block'});
            return this;
        },
        hide: function () {
            this._progressElement.setStyle({display: 'none'});
            return this;
        },
        remove: function () {
            this._progressElement.remove();
            return this;
        },
        setRequestName: function (name) {
            this._requestName = name;
            return this;
        },
        getRequestName: function () {
            return (this._requestName || '') + ' ';
        },
        interval: function (percentComplete) {
            var percentage = Math.round(percentComplete * 100);
            this._$innerDiv.setStyle({'width': percentage + '%'});
            this._$innerDiv.update('<div>' + this.getRequestName() + percentage + '%</div>');
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
        self._translations = {};
        self._tableColumnCount = 10;
        self._currentTrIndex = 0;
        self._previousTrIndex = 0;
        self._concurrentReqPerProd = {};
        self._fileSlice = window.File.prototype.slice || window.File.prototype.mozSlice || window.File.prototype.webkitSlice;
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
            return console.log('js:PicturePerfect Global Config not found. General error!');
        }

        self._globalConfig = {
            uploadUrl: _checkHttp(config.uploadUrl || false),
            galleryUrl: _checkHttp(config.galleryUrl || false),
            form_key: config.form_key || false,
            post: config.post || {}
//            paramXYZ: decodeURIComponent(config.rmc || '{}').evalJSON(true)
        };

        self._translations = config.translations || {};
        return this;
    };

    /**
     *
     * @returns {boolean}
     * @private
     */
    PicturePerfect.prototype.__ = function (translation) {
        return this._translations[translation] || 'Translation Missing: ' + translation;
    };

    /**
     *
     * @returns {boolean}
     * @private
     */
    PicturePerfect.prototype._isFileReaderEnabled = function () {
        return window.FileReader !== undefined && window.FormData !== undefined;
    };

    /**
     *
     * @returns {Function}
     */
    PicturePerfect.prototype.domLoaded = function () {
        var self = this;

        if (self._isFileReaderEnabled() === false) {
            return function _missingFileReader() {
                return console.log('js:FileReader is missing');
            };
        }

        return function ppDomLoaded() {
            self._initConfig();
            self._initFileReaderOnTableRows();
            var mag = new MassActionGalleryButton(self._globalConfig);
            mag.getProductGrid().observe('element:update', function (event) {
                var target = event.srcElement || event.target;
                if ('productGrid' === target.id) {
                    self._initFileReaderOnTableRows();
                }
            });
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
        return new TagTip(trElement, self.__('Waiting for upload ...'), _tipOptions);
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

        content += self.__('Product ID:') + ' ' + productId + '; Uploaded: <strong>' + file.name + ' (' + file.extra.prettySize + ')</strong><br/>';

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
     * @param secondTd
     * @param msgObj
     * @returns {*}
     * @private
     */
    PicturePerfect.prototype._handleError = function (secondTd, msgObj) {
        var self = this, ret = null;

        if (msgObj.alert) {
            alert(msgObj.alert);
        }

        secondTd.addClassName('fReaderError');

        if (msgObj.log) {
            ret = console.log(msgObj.log);
        } else {
            ret = null;
        }
        return ret;
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
     * @private
     */
    PicturePerfect.prototype._fileReaderEventBeforeStart = function (event, $secondTd) {
        var self = this;
        $secondTd.removeClassName('fReaderError');
        $secondTd.removeClassName('fReaderSuccess');
    };

    /**
     *
     * @param binaryString
     * @param nonBinaryFormLength integer
     * @returns {{blobber: Array, size: number, isTiny: boolean}}
     * @private
     */
    PicturePerfect.prototype._getBlob = function (binaryString, nonBinaryFormLength) {
        var self = this,
            numberOfFiles = 0,
            numberOfFilesAllowedPerReq = 0,
            maxFilesPerReq = 0,
            _postMaxSize = (self._globalConfig.post.postMaxSize - nonBinaryFormLength),
            fi = 0,
            fsStart = 0,
            fsEnd = self._globalConfig.post.uploadMaxFileSize,
            newBlob = new window.Blob([binaryString], { type: 'image/jpg'}),
            blobSlicedContainer = [],
            blobFish = {
                blobber: [],
                'size': newBlob.size,
                'totalFiles': 0,
                tmpFileName: 'pp_' + Math.random().toString(36).substring(7),
                isTiny: newBlob.size < self._globalConfig.post.uploadMaxFileSize && newBlob.size < _postMaxSize
            };

        numberOfFiles = Math.ceil(blobFish.size / self._globalConfig.post.uploadMaxFileSize);

        for (fi = 0; fi < numberOfFiles; fi = fi + 1) {
            blobSlicedContainer.push(self._fileSlice.call(newBlob, fsStart, fsEnd, 'image/jpg'));
            fsStart = fsEnd;
            fsEnd = fsStart + self._globalConfig.post.uploadMaxFileSize;
        }

        // creating an array. each index is a single request
        // first dim request, second dim -> all the blobs per request
        numberOfFilesAllowedPerReq = Math.floor(_postMaxSize / self._globalConfig.post.uploadMaxFileSize);
        maxFilesPerReq = numberOfFilesAllowedPerReq < self._globalConfig.post.maxFileUploads
            ? numberOfFilesAllowedPerReq
            : self._globalConfig.post.maxFileUploads;
        blobFish.blobber = new Array(blobSlicedContainer.eachSlice(maxFilesPerReq));
        blobFish.totalFiles = numberOfFiles;
        return blobFish;
    };

    /**
     *
     * @param aNumber
     * @returns {string}
     * @private
     */
    PicturePerfect.prototype._numberPad = function (aNumber) {
        var ret = '' + aNumber,
            totalLength = 3,
            padString = '0',
            i = 0;
        if (ret.length < totalLength) {
            for (i = ret.length; i <= totalLength; i = i + 1) {
                ret = padString + ret;
            }
        }
        return ret;
    };

    /**
     *
     * @param aString
     * @returns {number}
     * @private
     */
    PicturePerfect.prototype._getIntFromChars = function (aString) {
        var checkSum = 0;
        for (var i = 0, len = aString.length; i < len; ++i) {
            checkSum += aString.charCodeAt(i);
        }
        return checkSum;
    };

    /**
     * count the actual amount und parallel running uploads
     *
     * @param productId int
     * @param reqStart int
     * @returns {PicturePerfect}
     * @private
     */
//    PicturePerfect.prototype._setConcurrentRequestCount = function (productId, reqStart) {
//        var self = this;
//        if (!self._concurrentReqPerProd[productId]) {
//            self._concurrentReqPerProd[productId] = 0;
//        }
//        self._concurrentReqPerProd[productId] += reqStart;
//        return this;
//    };

    /**
     *
     * @param args object => event, file, $secondTd, productId
     * @private
     */
    PicturePerfect.prototype._fileReaderEventLoad = function (args) {

        var self = this,
            partialFileNameReq = '',
            postData = {
                'form_key': self._globalConfig.form_key,
                'productId': args.productId,
                'file': JSON.stringify({
                    'name': args.file.name,
                    'extra': args.file.extra
                }),
                'bdReqId': 1
            },
            blobFish = self._getBlob((args.event.target || args.event.srcElement).result, self._getNonBinaryFormLength(postData));

        postData.bdReqCount = blobFish.blobber.length; // number of total request made for upload
        postData.bdTotalFiles = blobFish.totalFiles;
        delete args.event;

        // one unique color per multiple upload
        args.colorIndex = self._getIntFromChars(args.file.extra.nameNoExtension);

//        self._setConcurrentRequestCount(args.productId, 1);
//        console.log('start: ', self._concurrentReqPerProd[args.productId]);

        /**
         * one request and n file/s to post
         */
        if (postData.bdReqCount === 1) {
            partialFileNameReq = self._numberPad(postData.bdReqCount);
            if (true === blobFish.isTiny) { // one file
                postData['binaryData[1]'] = {
                    content: blobFish.blobber[0][0],
                    filename: blobFish.tmpFileName + '__' + partialFileNameReq + '_' + self._numberPad(1) + '.bin'
                };
            } else {
                blobFish.blobber[0].forEach(function (theBlob, index) { // n files
                    var fileIndex = index + 1;
                    postData['binaryData[' + fileIndex + ']'] = {
                        content: theBlob,
                        filename: blobFish.tmpFileName + '__' + partialFileNameReq + '_' + self._numberPad(fileIndex) + '.bin'
                    };
                });
            }
            self._fileReaderHandleSingleRequest(args).sendPost(postData);
            return this;
        }

        /**
         * multiple request with multiple files
         * setTimeout is necessary because PHP fails to handle multiple request
         * therefore we need an order
         */
        if (postData.bdReqCount > 1) {

            blobFish.blobber.forEach(function (blobsPerRequest, requestIndex) {
                var reqIndex = requestIndex + 1,
                    partialFileNameReq = self._numberPad(reqIndex),
                    xhrObj = {},
                    postDataCloned = Object.clone(postData);

                postDataCloned.bdReqId = reqIndex;

                blobsPerRequest.forEach(function (theBlob, blobIndex) {
                    var blobFileIndex = blobIndex + 1;

                    postDataCloned['binaryData[' + blobFileIndex + ']'] = {
                        content: theBlob,
                        filename: blobFish.tmpFileName + '__' + partialFileNameReq + '_' + self._numberPad(blobFileIndex) + '.bin'
                    };
                });
                args.tmpFileNamePrefix = blobFish.tmpFileName;
                xhrObj = self._fileReaderHandleSingleRequest(args);
                xhrObj.sendPost(postDataCloned);
            });
            return this;
        }

        console.log('Something went terrible wrong with the blobFish!');
        return this;
        // handle multiple requests, hmm
    };

    /**
     *
     * @param postObject
     * @returns {Number}
     * @private
     */
    PicturePerfect.prototype._getNonBinaryFormLength = function (postObject) {
        return Math.ceil(JSON.stringify(postObject).length * 1.03); // plus 3%
    };

    /**
     * @todo race condition bug, when uploading multiple files for one product
     * not all images will be shown in the tag tip BUT their uploaded successfully
     * so you have to detect the amount of current active uploading connections
     *
     * @param args object -> postData, file, $secondTd, productId
     * @private
     */
    PicturePerfect.prototype._fileReaderHandleSingleRequest = function (args) {

        var singleReqSelf = this,
            ajaxRequest = {},
            $progressElement = new ProgressElement(args.colorIndex);

        $progressElement.setRequestName('ID ' + args.colorIndex);
        args.$secondTd.insert($progressElement.getElement());

        function xhrBefore() {
            $progressElement.show();
        }

        function xhrSuccess(event) { // @todo refactor
            var response = event.srcElement || event.target,
                result = {};

            try {
                result = JSON.parse(response.responseText);
            } catch (e) {
                // special case for singleReqSelf._setConcurren tRequestCount(args.productId, -1, -1);
                return singleReqSelf._handleError(args.$secondTd, {
                    alert: singleReqSelf.__('An error occurred. Tried to parse JSON response which could not be in JSON format.'),
                    log: [singleReqSelf.__('Invalid responseText in JSON'), e, response]
                });
            }

            if (result && _isObject(result) && undefined === result.fileProgress) {

//                singleReqSelf._setConcurrentRequestCount(args.productId, -1);
//                console.log('success: ', singleReqSelf._concurrentReqPerProd[args.productId]);

                if (result.err === false) {
                    args.$secondTd.removeClassName('fReaderError');
                    args.$secondTd.addClassName('fReaderSuccess');
                    singleReqSelf._updateTagTip(event, args.file, singleReqSelf._currentTrIndex, result.images, args.productId);
                } else {
                    singleReqSelf._handleError(args.$secondTd, {
                        alert: singleReqSelf.__('An error occurred:') + '\n' + result.msg
                    });
                }
                $progressElement.remove();
                return null;
            }

            if (result && result.fileProgress !== undefined) {

                if (result.fileProgress !== args.tmpFileNamePrefix) {
                    alert(singleReqSelf.__('Something went wrong during upload. Please try again. See console.log.'));
                    console.log(singleReqSelf.__('Error: matching upload file not found:'), result, args.tmpFileNamePrefix);
                }
                // do nothing ...
            } else {
                console.log('result', result);
                singleReqSelf._handleError(args.$secondTd, {
                    alert: singleReqSelf.__('An error occurred after uploading. No JSON found ...')
                });
            }
            $progressElement.remove();
            return null;
        }

        function xhrFail(event, status) {
            console.log('onFailure', status, event);
            args.$secondTd.addClassName('fReaderError');
            $progressElement.remove();
        }

        function uploadProgress(event) {
            var percentComplete = 0.00001;
            if (event.lengthComputable) {
                percentComplete = event.loaded / event.total;
                $progressElement.interval(percentComplete);
            }
            // else: Unable to compute progress information since the total size is unknown
        }

        function uploadLoadend(event) {
            // $progressElement.remove();
        }

        ajaxRequest = new PicturePerfectXhr(this._globalConfig.uploadUrl + '?rand=' + Math.random().toString(36).substring(10));
        ajaxRequest
            .before(xhrBefore)
            .done(xhrSuccess)
            .fail(xhrFail)
            .addUploadEvent('progress', uploadProgress)
            .addUploadEvent('loadend', uploadLoadend);
//            .sendPost(args.postData);
        return ajaxRequest;
    };

    /**
     * @see http://stackoverflow.com/questions/7431365/filereader-readasbinarystring-to-upload-files
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
            $secondTd = trElement.select('td');

        $secondTd = $secondTd[1] || {}; // used for the icons to place them in the background

        if (0 === productId) {
            return console.log('js:productId is 0 cannot instantiate fileReader', trElement);
        }

        FileReaderJS.setupDrop(trElement, {
            dragClass: 'fReaderDrag',
            accept: 'image/*',
            readAsMap: {
                'image/*': 'ArrayBuffer'
            },
            readAsDefault: 'ArrayBuffer',
            on: {

                dragenter: cfriSelf._fileReaderEventDragEnter.bindAsEventListener(cfriSelf),
                dragleave: cfriSelf._fileReaderEventDragLeave.bindAsEventListener(cfriSelf),
                beforestart: cfriSelf._fileReaderEventBeforeStart.bindAsEventListener(cfriSelf, $secondTd),
                load: function (event, file) {
                    cfriSelf._fileReaderEventLoad({
                        'event': event,
                        'file': file,
                        '$secondTd': $secondTd,
                        'productId': productId
                    });
                },
                error: function (e, file) {
                    // Native ProgressEvent
                    $secondTd.addClassName('fReaderError');
                    alert(cfriSelf.__('An error occurred. Please see console.log'));
                    return console.log('error: ', e, file);
                },
                skip: function (event) {
                    $secondTd.addClassName('fReaderError');
                    return console.log(cfriSelf.__('File format is not supported'), event);
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

}
    ).
    call(function () {
        return this || (typeof window !== 'undefined' ? window : global);
    }());
