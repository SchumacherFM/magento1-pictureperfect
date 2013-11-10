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
    function PicturePerfectXhr(url) {
        var self = this;
        self._xhr = {};
        self._url = url;
        self._callbacksBefore = [];
        self._callbacksSuccess = [];
        self._callbacksFailure = [];
        self._upDownEvents = [
            'loadstart',
            'progress',
            'load',
            'loadend',
            'error',
            'abort',
            'timeout'
        ];

        self._initTransport();
        return this;
    }

    /**
     *
     * @param callBack
     * @returns {PicturePerfectXhr}
     */
    PicturePerfectXhr.prototype.before = function (callBack) {
        if (callBack instanceof Function) {
            this._callbacksBefore.push(callBack);
        }
        return this;
    };

    /**
     *
     * @param callBack
     * @returns {PicturePerfectXhr}
     */
    PicturePerfectXhr.prototype.done = function (callBack) {
        if (callBack instanceof Function) {
            this._callbacksSuccess.push(callBack);
        }
        return this;
    };

    /**
     *
     * @param callBack
     * @returns {PicturePerfectXhr}
     */
    PicturePerfectXhr.prototype.fail = function (callBack) {
        if (callBack instanceof Function) {
            this._callbacksFailure.push(callBack);
        }
        return this;
    };
    /**
     *
     * @private
     */
    PicturePerfectXhr.prototype._initTransport = function () {
        var self = this,
            i = 0,
            len = 0,
            versions = ['MSXML2.XmlHttp.5.0',
                'MSXML2.XmlHttp.4.0',
                'MSXML2.XmlHttp.3.0',
                'MSXML2.XmlHttp.2.0',
                'Microsoft.XmlHttp'];

        if (XMLHttpRequest !== undefined) {
            self._xhr = new win.XMLHttpRequest();
        } else {

            for (i = 0, len = versions.length; i < len; ++i) {
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
            self._callbacksFailure.forEach(function (callBack) {
                callBack.apply(self, [event, self._xhr.status * -1]);
            });
            return;
        }

        if (self._xhr.readyState === 4) {
//            self._callbackSuccess(event, self._xhr);
            self._callbacksSuccess.forEach(function (callBack) {
                callBack.apply(self, [event]);
            });

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
    PicturePerfectXhr.prototype._createFormData = function () {

        var args = Array.prototype.slice.call(arguments),
            dataForm = new win.FormData(),
            value;

        args.forEach(function (postObject) {

            for (var key in postObject) {
                if (postObject.hasOwnProperty(key)) {
                    value = postObject[key];

                    if (typeof value === 'object' && value.content && value.content instanceof win.Blob) {
                        dataForm.append(key, value.content, value.filename);
                    } else {
                        dataForm.append(key, value);
                    }
                }
            }

        });

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

        self._callbacksBefore.forEach(function (callBack) {
            callBack();
        });

        self._sendPost(postData instanceof FormData ? postData : self._createFormData(postData));
        return this;
    };

    /**
     *
     * @param dataForm
     * @param iteration
     * @private
     */
    PicturePerfectXhr.prototype._sendPost = function (dataForm) {
        var self = this;
        self._xhr.open('post', self._url, true); // 3rd param async === true
        self._xhr.send(dataForm);
    };

    win.PicturePerfectXhr = PicturePerfectXhr;

})(window);