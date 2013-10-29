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
            self._xhr = new XMLHttpRequest();
        } else {

            for (var i = 0, len = versions.length; i < len; i++) {
                try {
                    self._xhr = new ActiveXObject(versions[i]);
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
        return true;
    }

    PicturePerfectXhr.prototype._toQueryString = function (postObject) {
        function toQueryPair(key, value) {
            return key + '=' + encodeURIComponent(value);
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
    PicturePerfectXhr.prototype.send = function (postData) {
        var self = this;
        if (Object.prototype.toString.call(postData) !== '[object Object]') {
            throw new Error('postData is not an object/array', postData);
        }

        self._xhr.open('post', self._url, true); // 3rd param async === true
        self._xhr.send(self._toQueryString(postData));
        return this;
    };
    //********************************************************************************************

    // dummy testing with huge amount of data !!!
    $('#loadProgress').on('click', function () {
        var ajaxRequest = new PicturePerfectXhr('https://author.vg.learnosity.com/app_dev.php/tag/alltags', {
            onSuccess: function onSuccess(event, xhrObj) {
                return console.log('success: ', event);
            },
            onFailure: function onFailure(state, event, xhr) {
                console.log('fail state: ', state);
                console.log('fail event: ', event);
                return console.log('fail xhr: ', xhr);
            }
        });

        ajaxRequest.addUploadEvent('progress', function (event) { // updates every 50ms
            console.log('progress', event);
            if (event.lengthComputable) {
                var percentComplete = event.loaded / event.total;
                console.log('percentComplete:', percentComplete); // now that works fine if limiting local band width
            } else {
                // Unable to compute progress information since the total size is unknown
            }
        });

        var pData = {};
        for (var i = 0; i < 100; i = i + 1) {
            var str = '';
            for (var j = 0; j < 1000; j = j + 1) {
                str += Math.random() + '_' + j;
            }
            pData['in' + i] = str;
        }

        ajaxRequest.send(pData);

    });

    window.PicturePerfectXhr = PicturePerfectXhr;

}).
    call(function () {
        return this || (typeof window !== 'undefined' ? window : global);
    }());
