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
module.exports = {
    render: function (input, out) {
        var cacheKey = input.cacheKey;
        if (!cacheKey) {
            throw new Error('cache-key is required for <cached-fragment>');
        }

        var cacheManager = input.cacheManager;

        var cache = cacheManager.getCache(input.cacheName || 'marko/cached-fragment');

        var asyncOut = out.beginAsync();

        cache.get(cacheKey,
            {
                builder: function(callback) {
                    var nestedOut = out.createOut();

                    if (input.renderBody) {
                        input.renderBody(nestedOut);
                    }

                    nestedOut.end();

                    nestedOut
                        .on('error', callback)
                        .on('finish', function() {
                            callback(null, nestedOut.getOutput());
                        });
                }
            }, function(err, result) {
                if (err) {
                    return asyncOut.error(err);
                }

                if (result.cloneNode) {
                    var curChild = result.firstChild;
                    while(curChild) {
                        asyncOut.node(curChild.cloneNode());
                        curChild = curChild.nextSibling;
                    }
                    asyncOut.end();
                } else {
                    asyncOut.end(result);
                }


            });
    }
};
