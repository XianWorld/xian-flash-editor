/**
 * Created with WebStorm.
 * User: Dianyan
 * Date: 2015/3/6
 * Time: 19:47
 * To change this template use File | Settings | File Templates.
 */

"use strict";

if (typeof Xian !== 'object') {
    Xian = {};
}

if (!Xian.AnimationItemHandler) {
    (function () {
        fl.runScript(Xian.scriptDirURI + 'item_handler.jsfl');
        var ItemHandler = Xian.ItemHandler;
        fl.runScript(Xian.scriptDirURI + 'utils.jsfl');
        var Utils = Xian.Utils;

        function AnimationItemHandler() {
            ItemHandler.call(this);

            this.animDir = 0;
            this.animName = "";
        }

        AnimationItemHandler.prototype = Utils.inherit(ItemHandler.prototype);
        AnimationItemHandler.prototype.constructor = AnimationItemHandler;

        AnimationItemHandler.prototype.getItemScaleData = function (exportItemHash, exportItems, scale) {
            Utils.traverseItemElements(this.item, function (timeline, layer, frame, element) {
                if (element.elementType !== 'instance') return;

                var instance = element;
                var item = instance.libraryItem;
                var itemData = exportItemHash[item.name];
                if (!itemData) {
                    itemData = {};
                    itemData.item = item;
                    itemData.refNum = 0;
                    itemData.scaleXSum = 0;
                    itemData.scaleYSum = 0;
                    itemData.scaleX = 1;
                    itemData.scaleY = 1;
                    exportItemHash[item.name] = itemData;
                    exportItems.push(itemData);
                    //fl.trace(item.name);
                }
                itemData.refNum++;
                itemData.scaleXSum += instance.scaleX;
                itemData.scaleYSum += instance.scaleY;
                itemData.scaleX = itemData.scaleXSum / itemData.refNum * scale;
                itemData.scaleY = itemData.scaleYSum / itemData.refNum * scale;

            }, true);
        };

        AnimationItemHandler.prototype.updateItemScaleData = function (exportItemHash, scale) {

            Utils.traverseItemElements(this.item, function (timeline, layer, frame, element) {
                if (element.elementType !== 'instance') return;

                var timelineItem = timeline.libraryItem;
                var instance = element;
                var item = instance.libraryItem;
                var itemData = exportItemHash[item.name];
                if (!itemData) {
                    return;
                }
                instance.scaleX /= itemData.scaleX;
                instance.scaleY /= itemData.scaleY;

                instance.scaleX *= scale;
                instance.scaleY *= scale;

                instance.x *= scale;
                instance.y *= scale;

                //if the instance is dependent on only one anther export item, then try replace it with the dependency item.
                if (itemData.dependencies.length == 1) {
                    var tempElement = itemData.dependencies[0];
                    var tempItem = tempElement.libraryItem;

                    instance.matrix = fl.Math.concatMatrix(tempElement.matrix, instance.matrix);
                    instance.libraryItem = tempItem;

                    fl.trace("[Info]: " + timelineItem.name + ' - ' + tempItem.name + " replace " + item.name);
                }
            }, true, true);
        };

        AnimationItemHandler.prototype.getSlotItemsHash = function (slotLayerHash, slotLayerItemsHash, defaultLayerName) {

            Utils.traverseItemElements(this.item, function (timeline, layer, frame, element) {
                if (element.elementType !== 'instance') return;

                var instance = element;
                var item = instance.libraryItem;

                var itemName = item.name;
                var layerName = layer.name;
                //var itemData = exportItemHash[itemName];
                //if (!itemData) {
                //    exportItemHash[itemName] = item;
                //}
                var tempLayer = slotLayerHash[layerName];
                var slotName = defaultLayerName;
                if (tempLayer) {
                    slotName = layerName;
                }
                //fl.trace(slotName);
                var slotItems = slotLayerItemsHash[slotName];
                if (!slotItems)
                    slotItems = slotLayerItemsHash[slotName] = {};
                if (!slotItems[itemName])
                    slotItems[itemName] = item;
            }, true);
        };

        AnimationItemHandler.prototype.updateSlotLayerName = function (itemSlotLayerHash) {

            Utils.traverseItemElements(this.item, function (timeline, layer, frame, element) {
                //var timelineItemName = timeline.libraryItem.name;
                //fl.trace(timelineItemName);
                if (element.elementType !== 'instance')
                    return;
                var instance = element;
                var item = instance.libraryItem;
                //var timelineItemName = timeline.libraryItem.name;
                //var state = itemStateHash[timelineItemName];
                //if(!state){
                //    state = itemStateHash[timelineItemName] = {};
                //}
                //if(state[layer])
                //    return;

                var layerName = layer.name;
                //fl.trace(timeline.libraryItem.name+": " + layer.name);
                var slotHash = itemSlotLayerHash[item.name];
                if (!slotHash)
                    return;

                if (slotHash[layerName])
                    return;

                var newLayerName = null;
                for (var key in slotHash) {
                    newLayerName = key;
                    break;
                }

                if (!newLayerName)
                    return;

                fl.trace(timeline.libraryItem.name + ": " + layer.name + " -> " + newLayerName);
                layer.name = newLayerName;
                //state[layer] = layer;
            }, true, true);

        };

        AnimationItemHandler.prototype.buildSkeletonPose = function (skeletonData) {
            var i, j, k, m, layer, layers, frame, frames, element, elements, instance, item;
            var timeline;
            var boneData;
            var slotData;
            var slotName;
            var boneName;

            timeline = this.item.timeline;

            layers = timeline.layers;

            //for (i = 0; i < layers.length; i++) {
            for (i = layers.length - 1; i >= 0; i--) {
                layer = layers[i];

                slotName = layer.name;

                slotData = skeletonData.getSlot(slotName);
                if (!slotData)
                    continue;
                //update slot order
                skeletonData.bringSlotToTop(slotData);

                frame = layer.frames[0];
                if (frame.elements.length == 0)
                    continue;
                element = frame.elements[0];
                if (element.elementType !== 'instance')
                    continue;

                item = element.libraryItem;
                //boneData = skeletonData.getBone(str);
                boneData = slotData.boneData;
                if (boneData) {
                    boneData.x = Utils.roundValue(element.x, 100);
                    boneData.y = Utils.roundValue(element.y, 100);
                    boneData.rotation = Utils.roundValue(element.rotation, 100);
                    boneData.skewX = Utils.roundValue(element.skewX, 100);
                    boneData.skewY = Utils.roundValue(element.skewY, 100);
                    boneData.scaleX = Utils.roundValue(element.scaleX, 100);
                    boneData.scaleY = Utils.roundValue(element.scaleY, 100);
                }

                //set slot's default attachment name
                slotData.attachmentName = item.name;
            }
        };

        AnimationItemHandler.prototype.buildAnimationData = function (skeletonData) {
            var dom = fl.getDocumentDOM();
            var frameTime = 1.0 / dom.frameRate;

            var animName = this.animName + "_" + this.animDir;
            var animationData = new Xian.Animation2DData(animName);
            animationData.boneTimelineDataHash = this.buildBoneAnimation(skeletonData, frameTime);

            animationData.slotTimelineDataHash = this.buildSlotAnimation(skeletonData, frameTime);

            if(!skeletonData.getAnimation(animName))
                skeletonData.addAnimation(animationData);

            return animationData;
        };
        AnimationItemHandler.prototype.buildBoneAnimation = function (skeletonData, frameTime) {
            var i, j, k, m, layer, layers, frame, frames, element, elements, instance, item;
            var timeline;
            var boneData;
            var slotData;
            var slotName;
            var boneName;

            timeline = this.item.timeline;

            layers = timeline.layers;

            var boneLayerHash = {};
            var boneLayers;
            for (i = 0; i < layers.length; i++) {
                layer = layers[i];

                slotName = layer.name;
                slotData = skeletonData.getSlot(slotName);
                if (!slotData)
                    continue;

                boneName = slotName.split("_")[0];
                boneData = skeletonData.getBone(boneName);
                if (!boneData)
                    continue;

                boneLayers = boneLayerHash[boneName];
                if (!boneLayers) {
                    boneLayers = boneLayerHash[boneName] = [];
                }
                boneLayers.push(layer);
            }

            var have = false;
            var bones = {};
            var boneTimelineHash;
            for (boneName in boneLayerHash) {
                boneLayers = boneLayerHash[boneName];

                boneTimelineHash = this.buildBoneTimeline(boneName, boneLayers, frameTime);
                if(boneTimelineHash){
                    bones[boneName] = boneTimelineHash;
                    have = true;
                }
            }
            if(have)
                return bones;
            return null;
        };

        AnimationItemHandler.prototype.buildBoneTimeline = function (boneName, layers, frameTime) {
            var i, j, k, m, layer, frame, frames, element, elements, instance, item;
            var timeline = this.item.timeline;

            var boneElement;
            var boneFrame;
            var boneFrames = [];
            Utils.traverseLayersElements(timeline, layers, function (timeline1, layer, frame, element) {
                if (element.elementType !== 'instance') return;

                var boneElement = boneFrames[frame.startFrame];
                if (!boneElement)
                    boneFrames[frame.startFrame] = frame;//element;
            }, true);

            var lastElement = null;
            var curve;
            var time;
            var have = false;
            //var translateTimeline = new Xian.TranslateTimelineData();
            var boneTimeline = new Xian.BoneTimelineData();
            for (i = 0; i < boneFrames.length; i++) {
                boneFrame = boneFrames[i];
                if(!boneFrame)
                    continue;
                boneElement = boneFrame.elements[0];
                if(!boneElement)
                    continue;

                curve = null;
                //"curve": "stepped"
                time = frameTime * i;

                var x = Utils.roundValue(boneElement.x, 100);
                var y = Utils.roundValue(boneElement.y, 100);
                var rotation = Utils.roundValue(boneElement.rotation, 100);
                var skewX = Utils.roundValue(boneElement.skewX, 100);
                var skewY = Utils.roundValue(boneElement.skewY, 100);
                var scaleX = Utils.roundValue(boneElement.scaleX, 100);
                var scaleY = Utils.roundValue(boneElement.scaleY, 100);

                //if(lastElement != null && boneElement.libraryItem.name !== lastElement.libraryItem.name)
                //    curve = "stepped";
                if(boneFrame.tweenType !== "motion"){
                    fl.trace(this.item.name + ": "+boneName + ", " + boneFrame.startFrame);
                    curve = "stepped";
                }

                boneTimeline.addTranslateFrame(time, x, y, curve);
                boneTimeline.addRotateFrame(time, rotation, skewX, skewY, curve);
                boneTimeline.addScaleFrame(time, scaleX, scaleY, curve);
                have = true;
                lastElement = boneElement;
            }

            //var have = false;
            //var boneTimelineHash = {};
            //if(translateTimeline.frames.length > 0){
            //    boneTimelineHash.translate = translateTimeline.frames;
            //    have = true;
            //}
            if(!have)
                return null;
            return boneTimeline.toJSON();
        };

        AnimationItemHandler.prototype.buildSlotAnimation = function (skeletonData, frameTime) {
            var i, j, k, m, layer, layers, frame, frames, element, elements, instance, item;
            var timeline;
            var slotData;
            var slotName;

            timeline = this.item.timeline;

            layers = timeline.layers;

            //build slot layer list hash map
            var slotLayerHash = {};
            var slotLayers;
            for (i = 0; i < layers.length; i++) {
                layer = layers[i];

                slotName = layer.name;
                slotData = skeletonData.getSlot(slotName);
                if (!slotData)
                    continue;

                slotLayers = slotLayerHash[slotName];
                if (!slotLayers) {
                    slotLayers = slotLayerHash[slotName] = [];
                }
                slotLayers.push(layer);
            }

            //build slot index hash per frame.
            var lastSlotLayerHash = {};
            var frameSlotIndexHash = [];
            var slotIndexHash;
            var have = true;
            var slotLayer;
            var frameCount = timeline.frameCount;
            for (j = 0; j < frameCount; j++) {
                m = 0;
                slotIndexHash = frameSlotIndexHash[j] = {};
                for (i = layers.length - 1; i >= 0; i--) {
                //for (i = 0; i < layers.length; i++) {
                    layer = layers[i];

                    slotName = layer.name;
                    slotData = skeletonData.getSlot(slotName);
                    if (!slotData)
                        continue;

                    slotLayers = slotLayerHash[slotName];
                    have = false;
                    for (k = 0; k < slotLayers.length; k++) {
                        slotLayer = slotLayers[k];
                        frames = slotLayer.frames;
                        if(frames.length <= j)
                            continue;
                        elements = frames[j].elements;
                        if(elements.length > 0){
                            have = true;
                            break;
                        }
                    }

                    if(!have)
                        slotLayer = lastSlotLayerHash[slotName] || slotLayer;
                    else
                        lastSlotLayerHash[slotName] = slotLayer;

                    if(layer !== slotLayer)
                        continue;

                    slotIndexHash[slotName] = m;
                    m++;
                }
            }

            var slotElement;
            var slotFrames = [];
            var slots = {};
            var slotTimelineHash;
            for (slotName in slotLayerHash) {
                slotLayers = slotLayerHash[slotName];

                slotFrames.length = 0;
                //Utils.traverseLayersElements(timeline, slotLayers, function (timeline1, layer, frame, element) {
                //    if (element.elementType !== 'instance') return;
                //
                //    slotElement = slotFrames[frame.startFrame];
                //    if (!slotElement)
                //        slotFrames[frame.startFrame] = element;
                //}, false);

                for (i = 0; i < slotLayers.length; i++) {
                    layer = slotLayers[i];
                    for (j = 0; j < layer.frames.length; j++) {
                        frame = layer.frames[j];
                        slotElement = slotFrames[j];
                        if (!slotElement)
                            slotElement = slotFrames[j] = {};

                        var isKeyFrame = (frame.startFrame === j);
                        if(!slotElement.element) {
                            slotElement.keyFrame = isKeyFrame;

                            if (frame.elements.length == 0)
                                continue;

                            slotElement.element = frame.elements[0];
                            //for (k = 0; k < frame.elements.length; k++) {
                            //    element = frame.elements[k];
                            //    callback(timeline, layer, frame, element);
                            //}
                        }
                    }
                }

                var time;
                var slotTimeline = new Xian.SlotTimelineData();
                for (i = 0; i < slotFrames.length; i++) {
                    slotElement = slotFrames[i];
                    element = slotElement.element;
                    time = frameTime * i;

                    var index = frameSlotIndexHash[i][slotName];
                    slotTimeline.addDrawOrderFrame(time, index);
                    if(slotElement.keyFrame) {
                        if (!element)
                            slotTimeline.addAttachmentFrame(time, null);
                        else
                            slotTimeline.addAttachmentFrame(time, element.libraryItem.name);
                        if (element) {
                            if (element.colorMode = 'tint') {
                                //fl.trace(elem.tintColor);
                                //fl.trace(elem.tintPercent);
                                var a = element.tintPercent < 0 ? 0 : element.tintPercent * 255 / 100;
                                //var color = (a<<24) | (slotElement.tintColor & 0xffffff);
                                var r = (element.tintColor >> 16) & 0xff;
                                var g = (element.tintColor >> 8) & 0xff;
                                var b = (element.tintColor) & 0xff;
                                slotTimeline.addColorFrame(time, r, g, b, a);
                            }
                            else {
                                slotTimeline.addColorFrame(time, 0, 0, 0, 0);
                            }
                        }
                    }
                }

                slotTimelineHash = slotTimeline.toJSON();

                //boneTimelineHash = this.buildBoneTimeline(boneName, boneLayers, frameTime);
                if(slotTimelineHash){
                    slots[slotName] = slotTimelineHash;
                    have = true;
                }
            }
            if(have)
                return slots;
            return null;
        };

        ItemHandler.registerHandler("AnimationItemHandler", AnimationItemHandler);
        Xian.AnimationItemHandler = AnimationItemHandler;
    }());
}
