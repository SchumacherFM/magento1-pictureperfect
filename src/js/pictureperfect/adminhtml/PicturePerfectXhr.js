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
    function PicturePerfectXhr(url, callBackObject) {
        var self = this;
        self._xhr = {};
        self._url = url;
        self._callbackSuccess = callBackObject.onSuccess || function () {
        };
        self._callbackFailure = callBackObject.onFailure || function () {
        };
        self._uploadEvents = [
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
    };

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
        var self = this, found = false;
        self._uploadEvents.forEach(function (availableEvent) {
            if (availableEvent === eventName) {
                self._xhr.upload.addEventListener(eventName, callback, false);
                found = true;
                return;
            }
        });
        if (false === found) {
            return console.log('event ' + eventName + ' not found!');
        }
        return this;
    }

    /**
     *
     * @param postObject
     * @returns {string}
     * @private
     */
    PicturePerfectXhr.prototype._toQueryString = function (postObject) {
        function toQueryPair(key, value) {
            return key + '=' + encodeURIComponent(value).replace(/%20/g, '+');
        }

        var queryValues = [];
        for (var key in postObject) {
            if (postObject.hasOwnProperty(key)) {
                var value = postObject[key];
                queryValues.push(toQueryPair(key, value));
            }
        }
        return queryValues.join('&');
    }

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

        var params = self._toQueryString(postData);

        self._xhr.open('post', self._url, true); // 3rd param async === true
        self._xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        self._xhr.send(params);
        return this;
    };

    win.PicturePerfectXhr = PicturePerfectXhr;

})(window);