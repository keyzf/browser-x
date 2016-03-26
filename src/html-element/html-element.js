'use strict';
var url = require('url');

var Element = require('../element');
var CSSStyleDeclaration = require('../style').CSSStyleDeclaration;

function HTMLElement(document, name, namespaceURI) {
    Element.call(this, document, name, namespaceURI);
}

HTMLElement.prototype = Object.create(Element.prototype, {
    lang: {
        get: function() {
            return this.getAttribute('lang') || '';
        }
    },
    style: {
        get: function() {
            if (this._style) {
                return this._style;
            } else {
                var style = this._style = new CSSStyleDeclaration();
                var cssText = this.getAttribute('style');

                if (cssText) {
                    style.cssText = cssText;
                }

                return this._style;
            }
        }
    }
});


HTMLElement.prototype.constructor = HTMLElement;


module.exports = HTMLElement;