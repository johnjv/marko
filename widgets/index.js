/**
* Module to manage the lifecycle of widgets
*
*/
'use strict';
var warp10 = require('warp10');
var WidgetsContext = require('./WidgetsContext');
var escapeEndingScriptTagRegExp = /<\//g;

function WrappedString(val) {
    this.html = val;
}

WrappedString.prototype = {
    safeHTML: function() {
        return this.html;
    }
};

exports.WidgetsContext = WidgetsContext;
exports.getWidgetsContext = WidgetsContext.getWidgetsContext;
exports.uniqueId = require('./uniqueId');

function flattenHelper(widgets, flattened) {
    for (var i = 0, len = widgets.length; i < len; i++) {
        var widgetDef = widgets[i];
        if (!widgetDef.type) {
            continue;
        }

        var children = widgetDef.children;

        if (children) {
            // Depth-first search (children should be initialized before parent)
            flattenHelper(children, flattened);
        }

        flattened.push(widgetDef.toJSON());
    }
}

function getRenderedWidgets(widgetsContext) {
    var widgets = widgetsContext.getWidgets();
    if (!widgets || !widgets.length) {
        return;
    }

    var flattened = [];
    flattenHelper(widgets, flattened);
    return flattened;
}


function writeInitWidgetsCode(widgetsContext, out) {
    var renderedWidgets = getRenderedWidgets(widgetsContext);
    if (!renderedWidgets) {
        return;
    }

    var cspNonce = out.global.cspNonce;
    var nonceAttr = cspNonce ? ' nonce='+JSON.stringify(cspNonce) : '';

    out.write('<script' + nonceAttr + '>' +
        '(function(){var w=window;(w.$widgets||w.$widgets||(w.$widgets=[])).concat(' +
        warp10.stringify(renderedWidgets).replace(escapeEndingScriptTagRegExp, '\\u003C/') +
         ')})()</script>');

    widgetsContext.clearWidgets();
}

exports.writeInitWidgetsCode = writeInitWidgetsCode;

/**
 * Returns an object that can be sent to the browser using JSON.stringify. The parsed object should be
 * passed to require('marko-widgets').initWidgets(...);
 *
 * @param  {WidgetsContext|AsyncWriter} widgetsContext A WidgetsContext or an AsyncWriter
 * @return {Object} An object with information about the rendered widgets that can be serialized to JSON. The object should be treated as opaque
 */
exports.getRenderedWidgets = exports.getRenderedWidgetIds /* deprecated */ = function(widgetsContext) {
    if (!(widgetsContext instanceof WidgetsContext)) {
        // Assume that the provided "widgetsContext" argument is
        // actually an AsyncWriter
        var out = widgetsContext;
        if (!out.global) {
            throw new Error('Invalid argument: ' + widgetsContext);
        }

        widgetsContext = WidgetsContext.getWidgetsContext(out);
    }

    var renderedWidgets = getRenderedWidgets(widgetsContext);
    return warp10.stringifyPrepare(renderedWidgets);
};

exports.defineComponent = require('./defineComponent');
exports.defineWidget = require('./defineWidget');
exports.defineRenderer = require('./defineRenderer');
exports.makeRenderable = exports.renderable = require('../runtime/renderable');

exports.r = require('./renderer');
exports.w = function() { /* no op for defining a widget on teh server */ };

// registerWidget is a no-op on the server.
// Fixes https://github.com/marko-js/marko-widgets/issues/111
exports.registerWidget = function(typeName) { return typeName; };
