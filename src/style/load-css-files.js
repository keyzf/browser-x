'use strict';
var cssom = require('cssom');
var url = require('url');
var Resource = require('../utils/resource');

function loadCssFiles(document, resource) {

    if (!(resource instanceof Resource)) {
        throw new Error('require `Resource`');
    }

    var styleSheets = document.styleSheets;
    var baseURI = document.baseURI;
    var forEach = Array.prototype.forEach;
    var queue = [];


    forEach.call(styleSheets, function(cssStyleSheet, index) {
        var ownerNode = cssStyleSheet.ownerNode;
        var nodeName = ownerNode.nodeName;

        if (nodeName === 'STYLE') {
            queue.push(loadImportFile(baseURI, cssStyleSheet));
        } else if (nodeName === 'LINK') {
            var href = ownerNode.href;
            queue.push(resource.get(href).then(function(data) {
                data = getContent(data);
                var cssStyleSheet = cssom.parse(data);
                cssStyleSheet.href = href;

                // 在真正的浏览器中，如果跨域，cssStyleSheet.cssRules 会等于 null
                styleSheets[index] = cssStyleSheet;

                return loadImportFile(baseURI, cssStyleSheet);
            }));
        }
    });


    function loadImportFile(baseURI, cssStyleSheet) {
        var parentStyleSheet = cssStyleSheet;
        var loadQueue = [];
        forEach.call(cssStyleSheet.cssRules, function(cssStyleRule) {
            if (cssStyleRule instanceof cssom.CSSImportRule) {

                var href = cssStyleRule.href;
                var file = url.resolve(baseURI, href);

                loadQueue.push(resource.get(file).then(function(data) {
                    data = getContent(data);
                    var cssStyleSheet = cssom.parse(data);
                    cssStyleSheet.parentStyleSheet = cssStyleSheet;
                    cssStyleSheet.href = file;
                    cssStyleRule.styleSheet = cssStyleSheet;

                    return loadImportFile(file, cssStyleSheet);
                }));
            }
        });

        return Promise.all(loadQueue);
    }

    return Promise.all(queue);
}


function getContent (content) {
    // 去掉 @charset，因为它可能触发 cssom 库的 bug
    // 使用空格占位避免改动代码位置
    return content.replace(/^(\@charset\b.+?;)(.*?)/i, function ($0, $1, $2) {
        var placeholder = new Array($1.length + 1).join(' ');
        return placeholder + $2;
    });
}

module.exports = loadCssFiles;