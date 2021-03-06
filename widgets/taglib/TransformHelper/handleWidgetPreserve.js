/*
 * Copyright 2011 eBay Software Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

function addPreserve(transformHelper, bodyOnly, condition) {
    let el = transformHelper.el;
    let context = transformHelper.context;
    let builder = transformHelper.builder;

    let preserveAttrs = {};

    if (bodyOnly) {
        preserveAttrs['body-only'] = builder.literal(bodyOnly);
    }

    if (condition) {
        preserveAttrs['if'] = condition;
    }

    let widgetIdInfo = transformHelper.assignWidgetId(true /* repeated */);
    let idVarNode = widgetIdInfo.idVarNode ? null : widgetIdInfo.createIdVarNode();

    preserveAttrs.id = transformHelper.getIdExpression();

    let preserveNode = context.createNodeForEl('w-preserve', preserveAttrs);
    let idVarNodeTarget;

    if (bodyOnly) {
        el.moveChildrenTo(preserveNode);
        el.appendChild(preserveNode);
        idVarNodeTarget = el;
    } else {
        el.wrapWith(preserveNode);
        idVarNodeTarget = preserveNode;
    }

    if (idVarNode) {
        idVarNodeTarget.onBeforeGenerateCode((event) => {
            event.insertCode(idVarNode);
        });
    }

    return preserveNode;
}

function deprecatedWarning(preserveType, transformHelper, el) {
    let attribute = preserveType.attribute;
    let suffix = preserveType.suffix;
    let context = transformHelper.getCompileContext();

    let newAttributeName = 'no-update';
    if (suffix) {
        newAttributeName += suffix;
    }

    context.deprecate(`The '${attribute}' attribute is deprecated. Please use '${newAttributeName}' instead.`);
}

function preserveHandler(transformHelper, preserveType, el) {
    if (preserveType.deprecated) {
        deprecatedWarning(preserveType, transformHelper, el);
    }

    el.removeAttribute(preserveType.attribute);
    addPreserve(transformHelper, false);
}

function preserveIfHandler(transformHelper, preserveType, el) {
    if (preserveType.deprecated) {
        deprecatedWarning(preserveType, transformHelper, el);
    }

    let attribute = preserveType.attribute;
    let preserveIfAttr = el.getAttribute(attribute);
    let preserveIfCondition = preserveIfAttr.argument;

    if (!preserveIfCondition) {
        transformHelper.addError(`The '${attribute}' attribute should have an argument. For example: <div ${attribute}(someCondition)>`);
        return;
    }

    addPreserve(transformHelper, false, transformHelper.builder.expression(preserveIfCondition));
    el.removeAttribute(attribute);
}

function preserveBodyHandler(transformHelper, preserveType, el) {
    if (preserveType.deprecated) {
        deprecatedWarning(preserveType, transformHelper, el);
    }

    el.removeAttribute(preserveType.attribute);
    addPreserve(transformHelper, true);
}

function preserveBodyIfHandler(transformHelper, preserveType, el) {
    if (preserveType.deprecated) {
        deprecatedWarning(preserveType, transformHelper, el);
    }

    let attribute = preserveType.attribute;
    let preserveBodyIfAttr = el.getAttribute(attribute);
    let preserveBodyIfCondition = preserveBodyIfAttr.argument;

    if (!preserveBodyIfCondition) {
        transformHelper.addError(`The '${attribute}' attribute should have an argument. For example: <div ${attribute}(someCondition)>`);
        return;
    }

    addPreserve(transformHelper, true, transformHelper.builder.expression(preserveBodyIfCondition));
    el.removeAttribute('w-preserve-body-if');
}

const preserveTypes = [
    // The new preserve types
    {
        attribute: 'no-update',
        handler: preserveHandler
    },
    {
        attribute: 'no-update-if',
        handler: preserveIfHandler
    },
    {
        attribute: 'no-update-body',
        handler: preserveBodyHandler
    },
    {
        attribute: 'no-update-body-if',
        handler: preserveBodyIfHandler
    },

    // The deprecated preserve types
    {
        attribute: 'w-preserve',
        handler: preserveHandler,
        deprecated: true
    },
    {
        attribute: 'w-preserve-if',
        suffix: '-if',
        handler: preserveIfHandler,
        deprecated: true
    },
    {
        attribute: 'w-preserve-body',
        suffix: '-body',
        handler: preserveBodyHandler,
        deprecated: true
    },
    {
        attribute: 'w-preserve-body-if',
        suffix: '-body-if',
        handler: preserveBodyIfHandler,
        deprecated: true
    }
];

module.exports = function handleWidgetPreserve() {
    let el = this.el;

    for (let i = 0; i < preserveTypes.length; i++) {
        let preserveType = preserveTypes[i];

        if (el.hasAttribute(preserveType.attribute)) {
            preserveType.handler(this, preserveType, el);
            return;
        }
    }
};