/**
 * Created with WebStorm.
 * User: Dianyan
 * Date: 2015/3/2
 * Time: 15:34
 * To change this template use File | Settings | File Templates.
 */

if (typeof Xian !== 'object') {
    Xian = {};
}

if (!Xian.Utils) {
    (function () {
        function getURIDir(file) {
            var index = file.lastIndexOf('/');
            var len = file.length;
            if (index === -1) {
                return file;
            }
            if (index === (len - 1)) {
                return file;
            }
            return file.substring(0, index + 1);
        }

        var documentDirURI = getURIDir(fl.getDocumentDOM().pathURI);
        var scriptDirURI = getURIDir(fl.scriptURI);

        //load JSON encoder/decoder
        fl.runScript(scriptDirURI + 'json2.jsfl');

        function inherit(p) {
            if (p == null) throw TypeError;
            if (Object.create)
                return Object.create(p);
            var t = typeof p;
            if (t !== "object" && t !== "function") throw TypeError;
            function f() {
            };
            f.prototype = p;
            return new f;
        }

        function extend(o, p) {
            for (var prop in p) {
                o[prop] = p[prop];
            }
            return o;
        }

        function getDomJson(dom) {
            dom || (dom = fl.getDocumentDOM());
            var domJson = {};
            var timeline = dom.getTimeline();
            domJson.timeline = getTimelineJson(timeline);

            return domJson;
        }

        function getDomJsonString(dom) {
            var domJson = getDomJson(dom);
            return JSON.stringify(domJson, null, '\t');
        }

        function getTimelineJson(timeline) {
            var i, j, k, layer, frame, frames, element, elements, instance;
            //var dom = fl.getDocumentDOM();
            //var timeline = dom.getTimeline();
            //var library = dom.library;
            var layers = timeline.layers;

            var currentLayerId = timeline.currentLayer;
            var currentLayer = layers[currentLayerId];
            var currentFrames = currentLayer.frames;
            var currentFrameId = timeline.currentFrame;
            var currentFrame = currentFrames[currentFrameId];
            var currentElements = currentFrame.elements;

            var domObj, timelineObj, layerObj, frameObj, elementObj, itemObj;
            domObj = {};
            domObj.timeline = timelineObj = {
                layers: []
            };
            for (i = 0; i < layers.length; i++) {
                layer = layers[i];
                layerObj = {
                    id: i,
                    name: layer.name,
                    animationType: layer.animationType,
                    layerType: layer.layerType,
                    frameCount: layer.frameCount,
                    frames: []
                };
                //fl.trace(
                //    "[Layer] " + i
                //    + " Name = " + layer.name
                //    + " animationType = " + layer.animationType
                //    + " layerType = " + layer.layerType
                //    + " frameCount = " + layer.frameCount
                //);
                for (j = 0; j < layer.frames.length; j++) {
                    frame = layer.frames[j];
                    frameObj = {
                        id: j,
                        name: frame.name,
                        duration: frame.duration,
                        labelType: frame.labelType,
                        startFrame: frame.startFrame,
                        tweenType: frame.tweenType,
                        hasCustomEase: frame.hasCustomEase,
                        tweenEasing: frame.tweenEasing,
                        elements: []
                    };
                    //fl.trace(
                    //    "\t[Frames] " + j
                    //    + " Name = " + frame.name
                    //    + " duration = " + frame.duration
                    //    + " labelType = " + frame.labelType
                    //    + " startFrame = " + frame.startFrame
                    //    + " tweenType = " + frame.tweenType
                    //    + " hasCustomEase = " + frame.hasCustomEase
                    //    + " tweenEasing = " + frame.tweenEasing
                    //);
                    //if (frame.isMotionObject()) {
                    //    fl.trace(
                    //        "\t\t[MotionObject] : " + frame.getMotionObjectXML());
                    //}
                    for (k = 0; k < frame.elements.length; k++) {
                        element = frame.elements[k];
                        elementObj = {
                            id: k,
                            name: element.name,
                            left: element.left,
                            top: element.top,
                            width: element.width,
                            height: element.height,
                            transformX: element.transformX,
                            transformY: element.transformY,
                            x: element.x,
                            y: element.y,
                            rotation: element.rotation,
                            scaleX: element.scaleX,
                            scaleY: element.scaleY,
                            skewX: element.skewX,
                            skewY: element.skewY,
                            depth: element.depth
                        };
                        //fl.trace(
                        //    "[Element] " + k
                        //    + " name = " + element.name
                        //    + " elementType = " + element.elementType
                        //    + " bounds = " + element.left + "," + element.top + "," + element.width + "," + element.height
                        //    + " transform = " + element.transformX + "," + element.transformY
                        //    + " pos = " + element.x + "," + element.y
                        //    + " rotation = " + element.rotation
                        //    + " scale = " + element.scaleX + "," + element.scaleY
                        //    + " skew = " + element.skewX + "," + element.skewY
                        //    + " Depth = " + element.depth
                        //);
                        //
                        if (element.elementType === 'instance') {
                            instance = element;
                            elementObj.instanceType = instance.instanceType;
                            elementObj.libraryItem = instance.libraryItem.name + "(" + instance.libraryItem.itemType + ")";
                            //fl.trace(
                            //    "[Instance] "
                            //    + " instanceType = " + instance.instanceType
                            //    + " libraryItem = " + instance.libraryItem
                            //);
                        }
                        frameObj.elements[k] = elementObj;
                    }
                    layerObj.frames[j] = frameObj;
                }
                timelineObj.layers[i] = layerObj;
            }
            return timelineObj;
            //var data = JSON.stringify(domObj, null, '\t');
            //fl.trace(data);
        }

        function getTimelineJsonString(timeline) {
            var timelineJson = getTimelineJson(timeline);
            return JSON.stringify(timelineJson, null, '\t');
        }

        function traverseItemsElements(items, callback, keyframe, edit) {
            var m;
            var len = items.length;
            for (m = 0; m < len; m++) {
                if (!items[m]) continue;
                traverseItemElements(items[m], callback, keyframe, edit);
                //traverseTimelineElements(items[m].timeline, callback, keyframe);
            }
        }

        function traverseItemElements(item, callback, keyframe, edit) {
            var dom = fl.getDocumentDOM();
            var library = dom.library;

            //when you get item timeline when it is not opened, it is an copy of the original object.
            //if you want to modify the original memo object, then you need edit it and close it.
            library.selectItem(item.name);
            //fl.trace("1_traverseItemElements: " + item.name);
            if (edit) {
                //alert("1_traverseItemElements: " + item.name);
                var result = library.editItem(item.name);
                //fl.trace(dom.getTimeline());
                //fl.trace("2_traverseItemElements: " + result);
                //alert("2_traverseItemElements: " + item.name);
                traverseTimelineElements(item.timeline, callback, keyframe);
                //traverseTimelineElements(dom.getTimeline(), callback, keyframe);
                //fl.trace("3_traverseItemElements: " + item.name);
                //alert("3_traverseItemElements: " + item.name);
                //dom.editScene(0);
            }
            else
                traverseTimelineElements(item.timeline, callback, keyframe);
            //traverseTimelineElements(item.timeline, callback, keyframe);
        }

        function traverseTimelineElements(timeline, callback, keyframe) {
            traverseLayersElements(timeline, timeline.layers, callback, keyframe);
            //var i, j, k, m, layer, layers, frame, frames, element, elements, instance, item;
            //var isKeyFrame = false;
            //layers = timeline.layers;
            //
            ////fl.trace("1_traverseTimelineElements: " + layers.length);
            //for (i = 0; i < layers.length; i++) {
            //    //timeline.currentLayer = i;
            //    layer = layers[i];
            //    for (j = 0; j < layer.frames.length; j++) {
            //        //timeline.currentFrame = j;
            //        frame = layer.frames[j];
            //        isKeyFrame = (frame.startFrame === j);
            //        if (keyframe && !isKeyFrame) continue;
            //        for (k = 0; k < frame.elements.length; k++) {
            //            element = frame.elements[k];
            //            callback(timeline, layer, frame, element);
            //        }
            //    }
            //}
        }

        function traverseLayersElements(timeline, layers, callback, keyframe) {
            var i, j, k, m, layer, frame, frames, element, elements, instance, item;
            var isKeyFrame = false;
            //layers = timeline.layers;

            //fl.trace("1_traverseTimelineElements: " + layers.length);
            for (i = 0; i < layers.length; i++) {
                //timeline.currentLayer = i;
                layer = layers[i];
                for (j = 0; j < layer.frames.length; j++) {
                    //timeline.currentFrame = j;
                    frame = layer.frames[j];
                    isKeyFrame = (frame.startFrame === j);
                    if (keyframe && !isKeyFrame) continue;
                    for (k = 0; k < frame.elements.length; k++) {
                        element = frame.elements[k];
                        callback(timeline, layer, frame, element);
                    }
                }
            }
        }

        function traverseLayerElements(timeline, layer, callback, keyframe) {
            var i, j, k, m, frame, frames, element, elements, instance, item;
            var isKeyFrame = false;
            //layers = timeline.layers;

            //fl.trace("1_traverseTimelineElements: " + layers.length);
            //timeline.currentLayer = i;
            for (j = 0; j < layer.frames.length; j++) {
                //timeline.currentFrame = j;
                frame = layer.frames[j];
                isKeyFrame = (frame.startFrame === j);
                if (keyframe && !isKeyFrame) continue;
                for (k = 0; k < frame.elements.length; k++) {
                    element = frame.elements[k];
                    callback(timeline, layer, frame, element);
                }
            }
        }

        function getLibraryItemByName(itemName) {
            var dom = fl.getDocumentDOM();
            var library = dom.library;

            var index = library.findItemIndex(itemName);
            if (index >= 0)
                return library.items[index];

            return undefined;
        }

        function getSubLayers(layers, parentLayer) {
            var i, layer;
            var subLayers = [];
            var parentName = parentLayer;
            if (typeof(parentLayer) != 'string')
                parentName = parentLayer.name;
            for (i = 0; i < layers.length; i++) {
                layer = layers[i];
                if (!layer.parentLayer)
                    continue;
                if (layer.parentLayer.name !== parentName)
                    continue;
                subLayers.push(layer);
            }
            return subLayers;
        }

        function getLayerIndex(timeline, layer, select) {
            var indexs = timeline.findLayerIndex(layer.name);
            if (!indexs)
                return -1;
            var layers = timeline.layers;
            for (var i = 0; i < indexs.length; i++) {
                if (layers[indexs[i]] == layer) {
                    if (select) timeline.currentLayer = indexs[i];
                    return indexs[i];
                }
            }
            return -1;
        }

        function roundValue(value, round) {
            if (!value) return value;
            round || (round = 1);
            value = Math.round(value * round) / round;
            return value;
        }

        function compareValue(v1, v2, tolerance) {
            if(v1 == null && v2 == null) return 0;
            if(v1 == null && v2 != null) return -1;
            if(v1 != null && v2 == null) return 1;

            var v = v1 - v2;
            tolerance = tolerance || 0;
            if (Math.abs(v) <= tolerance)
                return 0;

            if (v < 0) return -1;
            if (v > 0) return 1;
        }

        var Utils = {};
        Utils.getURIDir = getURIDir;
        Utils.documentDirURI = documentDirURI;
        Utils.scriptDirURI = scriptDirURI;
        Utils.inherit = inherit;
        Utils.extend = extend;

        Utils.getDomJson = getDomJson;
        Utils.getDomJsonString = getDomJsonString;
        Utils.getTimelineJson = getTimelineJson;
        Utils.getTimelineJsonString = getTimelineJsonString;

        Utils.traverseItemsElements = traverseItemsElements;
        Utils.traverseItemElements = traverseItemElements;
        Utils.traverseTimelineElements = traverseTimelineElements;
        Utils.traverseLayersElements = traverseLayersElements;
        Utils.traverseLayerElements = traverseLayerElements;

        Utils.getLibraryItemByName = getLibraryItemByName;
        Utils.getSubLayers = getSubLayers;
        Utils.getLayerIndex = getLayerIndex;

        //Math functions
        Utils.roundValue = roundValue;
        Utils.compareValue = compareValue;

        Xian.Utils = Utils;
    }());
}
