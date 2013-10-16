/**
 * @category    SchumacherFM_PicturePerfect
 * @package     JavaScript
 * @author      Cyrill at Schumacher dot fm / @SchumacherFM
 * @copyright   Copyright (c)
 */
/*global $,marked,varienGlobalEvents,Ajax,FileReaderJS,Event,encode_base64,reMarked*/
;
(function () {
    'use strict';
    var
        _markDownGlobalConfig = {},
        _initializedFileReaderContainer = {};

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
     * inits the global md config
     * @returns bool
     * @private
     */
    function _initGlobalConfig() {

        var config = JSON.parse($('pictureperfectGlobalConfig').readAttribute('data-config') || '{}');
        if (config.dt === undefined) {
            return console.log('PicturePerfect Global Config not found. General error!');
        }

        _markDownGlobalConfig = {
            tag: decodeURIComponent(config.dt),
            uploadUrl: _checkHttp(config.fuu || false),
            mediaBaseUrl: _checkHttp(config.phi || false),
            extraRendererUrl: _checkHttp(config.eru || false),
            eeLoadOnClick: config.eeloc || false,
            reMarkedCfg: decodeURIComponent(config.rmc || '{}').evalJSON(true)
        };
        return true;
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
     * @returns {boolean}
     * @private
     */
    function _isFileReaderEnabled() {
        return window.FileReader !== undefined;
    }

    /**
     *
     * @param target event.target
     * @private
     */
    function _createFileReaderInstance(target) {

        if (encode_base64 === undefined) {
            return console.log('FileReader not available because method encode_base64() is missing!');
        }

        if (false === _markDownGlobalConfig.uploadUrl) {
            return console.log('FileReader upload url not available!');
        }

        var opts = {
            dragClass: 'fReaderDrag',
            accept: 'image/*',
            readAsMap: {
                'image/*': 'BinaryString'
            },
            readAsDefault: 'BinaryString',
            on: {
                load: function (e, file) {

                    var ar = new Ajax.Request(_markDownGlobalConfig.uploadUrl, {
                        onSuccess: function (response) {
                            var result = JSON.parse(response.responseText);
                            if (result && _isObject(result)) {
                                if (result.err === false) {
                                    return _fileReaderAddImageToPicturePerfect(result.fileUrl);
                                }
                                if (result.err === true) {
                                    alert('An error occurred:\n' + result.msg);
                                }
                            } else {
                                alert('An error occurred after uploading. No JSON found ...');
                            }
                            return false;
                        },
                        method: 'post',
                        parameters: {
                            'binaryData': encode_base64(e.target.result),
                            'file': JSON.stringify(file)
                        }
                    });

                },
                error: function (e, file) {
                    // Native ProgressEvent
                    alert('An error occurred. Please see console.log');
                    return console.log('error: ', e, file);
                },
                skip: function (e, file) {
                    return console.log('File format is not supported', file);
                }
            }
        };

        FileReaderJS.setupDrop(target, opts);
        _initializedFileReaderContainer[target.id] = true;
    }

    document.observe('dom:loaded', _mdInitialize);

}).
    call(function () {
        return this || (typeof window !== 'undefined' ? window : global);
    }());
