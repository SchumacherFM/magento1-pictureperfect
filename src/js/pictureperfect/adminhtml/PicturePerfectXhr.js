/**
 * @category    SchumacherFM_PicturePerfect
 * @package     JavaScript
 * @author      Cyrill at Schumacher dot fm / @SchumacherFM
 * @copyright   Copyright (c)
 */
/*global $,$$,marked,varienGlobalEvents,Ajax,FileReaderJS,Event,Element,encode_base64,Tagtip*/
;
(function (win) {
    'use strict';

    /**
     * need my own xhr object ... prototype.js sucks ...
     *
     * @param url
     * @param callBackObject
     * @constructor
     */
    function PicturePerfectXhr(url, callBackObject, postConfig) {
        var self = this;
        self._xhr = {};
        self._url = url;
        self._postConfig = postConfig || {};
        self._callbackSuccess = callBackObject.onSuccess || function () {
        };
        self._callbackFailure = callBackObject.onFailure || function () {
        };
        self._upDownEvents = [
            'loadstart',
            'progress',
            'load',
            'loadend',
            'error',
            'abort',
            'timeout'
        ];
        self.fileSlice = window.File.prototype.slice || window.File.prototype.mozSlice || window.File.prototype.webkitSlice;

        self._initTransport();
        return this;
    }

    /**
     *
     * @private
     */
    PicturePerfectXhr.prototype._initTransport = function () {
        var self = this,
            versions = ['MSXML2.XmlHttp.5.0',
                'MSXML2.XmlHttp.4.0',
                'MSXML2.XmlHttp.3.0',
                'MSXML2.XmlHttp.2.0',
                'Microsoft.XmlHttp'];

        if (XMLHttpRequest !== undefined) {
            self._xhr = new win.XMLHttpRequest();
        } else {

            for (var i = 0, len = versions.length; i < len; i++) {
                try {
                    self._xhr = new win.ActiveXObject(versions[i]);
                    break;
                }
                catch (e) {
                }
            }
        }
        self._xhr.onreadystatechange = self._onReadyStateChange.bind(self);
    };

    /**
     *
     * @param event
     * @private
     */
    PicturePerfectXhr.prototype._onReadyStateChange = function (event) {
        var self = this;

        if (self._xhr.readyState < 4) {
            return;
        }

        if (self._xhr.status !== 200) {
            self._callbackFailure(self._xhr.status * -1, event, self._xhr);
            return;
        }

        if (self._xhr.readyState === 4) {
            self._callbackSuccess(event, self._xhr);
            return;
        }
    }

    /**
     *
     * @param eventName
     * @param callback
     * @returns {*}
     */
    PicturePerfectXhr.prototype.addUploadEvent = function (eventName, callback) {
        this._addEvent('upload', eventName, callback);
        return this;
    }

    /**
     *
     * @param eventName
     * @param callback
     * @returns {*}
     */
    PicturePerfectXhr.prototype.addDownloadEvent = function (eventName, callback) {
        this._addEvent('download', eventName, callback);
        return this;
    }

    /**
     *
     * @param type
     * @param eventName
     * @param callback
     * @returns {*}
     * @private
     */
    PicturePerfectXhr.prototype._addEvent = function (type, eventName, callback) {
        var self = this, found = false,
            _xhrObj = type === 'upload' ? self._xhr.upload : self._xhr;

        self._upDownEvents.forEach(function (availableEvent) {
            if (availableEvent === eventName) {
                _xhrObj.addEventListener(eventName, callback, false);
                found = true;
                return;
            }
        });
        if (false === found) {
            return console.log('event ' + eventName + ' not found!');
        }
        return this;
    };

    /**
     *
     * @param postObject
     * @returns {FormData}
     * @private
     */
    PicturePerfectXhr.prototype._createFormData = function (postObject) {

        var dataForm = new win.FormData();

        for (var key in postObject) {
            if (postObject.hasOwnProperty(key)) {
                var value = postObject[key];
                dataForm.append(key, value);
            }
        }
        return dataForm;
    };

    /**
     *
     * @param postData
     * @returns {*}
     */
    PicturePerfectXhr.prototype.sendPost = function (postData) {
        var self = this;
        if (Object.prototype.toString.call(postData) !== '[object Object]') {
            throw new Error('postData is not an object/array', postData);
        }


        var blobFish = postData[self._postConfig.checkForChunkFieldName] || {},
            isBlobFish = (blobFish instanceof win.Blob),
            blobFishSize = isBlobFish ? blobFish.size : 0,
            postMaxSizeOpt = self._postConfig.postMaxSize - self._getNonBinaryFormLength(postData),
        // uploadMaxFileSize must be always smaller than postMaxSize
            isTinyBlobFish = blobFishSize < self._postConfig.uploadMaxFileSize && blobFishSize < postMaxSizeOpt;


        // if not a blob found or blob size smaller than php post max size, then go
        if (false === isBlobFish || true === isTinyBlobFish) {
            self._sendPost(self._createFormData(postData));
            return this;
        }

        // now send in chunked sizes
        var bytesPerChunk = Math.ceil(blobFishSize / self._postConfig.uploadMaxFileSize),
            numberOfFormSubmission = Math.ceil(self._postConfig.maxFileUploads / bytesPerChunk);
        //  self._postConfig.maxFileUploads
        // @todo code here next

        console.log(numberOfFormSubmission,bytesPerChunk, self._postConfig.maxFileUploads, self._postConfig);

//        var dataForm = self._createFormData(postData);
//        self._sendPost(dataForm);

        return this;
    };

    /**
     *
     * @param postObject
     * @returns {Number}
     * @private
     */
    PicturePerfectXhr.prototype._getNonBinaryFormLength = function (postObject) {
        var self = this,
            lengthArray = [];

        for (var key in postObject) {
            if (postObject.hasOwnProperty(key) && key !== self._postConfig.checkForChunkFieldName) {
                lengthArray.push(JSON.stringify({key: postObject[key]}));
            }
        }
        return Math.ceil(lengthArray.join('&').length * 1.05); // plus 5%
    }

    /**
     *
     * @param dataForm
     * @private
     */
    PicturePerfectXhr.prototype._sendPost = function (dataForm) {
        var self = this;
        self._xhr.open('post', self._url, true); // 3rd param async === true
        self._xhr.send(dataForm);
    };

    win.PicturePerfectXhr = PicturePerfectXhr;

})(window);