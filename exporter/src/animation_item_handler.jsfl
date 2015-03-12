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
            var i, j, k, m, layer, layers, frame, frames, element, elements, instance, item;
            var timeline = this.item.timeline;

            var boneElement;
            var boneFrames = [];
            Utils.traverseLayersElements(timeline, layers, function (timeline1, layer, frame, element) {
                if (element.elementType !== 'instance') return;

                var boneElement = boneFrames[frame.startFrame];
                if (!boneElement)
                    boneFrames[frame.startFrame] = element;
            }, true);

            var time;

            //var translateTimeline = new Xian.TranslateTimelineData();
            var boneTimeline = new Xian.BoneTimelineData();
            for (i = 0; i < boneFrames.length; i++) {
                boneElement = boneFrames[i];
                if(!boneElement)
                    continue;
                time = frameTime * i;

                var x = Utils.roundValue(boneElement.x, 100);
                var y = Utils.roundValue(boneElement.y, 100);
                var rotation = Utils.roundValue(boneElement.rotation, 100);
                var skewX = Utils.roundValue(boneElement.skewX, 100);
                var skewY = Utils.roundValue(boneElement.skewY, 100);
                var scaleX = Utils.roundValue(boneElement.scaleX, 100);
                var scaleY = Utils.roundValue(boneElement.scaleY, 100);

                boneTimeline.addTranslateFrame(time, x, y);
                boneTimeline.addRotateFrame(time, rotation, skewX, skewY);
                boneTimeline.addScaleFrame(time, scaleX, scaleY);
            }

            //var have = false;
            //var boneTimelineHash = {};
            //if(translateTimeline.frames.length > 0){
            //    boneTimelineHash.translate = translateTimeline.frames;
            //    have = true;
            //}

            return boneTimeline.toJSON();
        };

        ItemHandler.registerHandler("AnimationItemHandler", AnimationItemHandler);
        Xian.AnimationItemHandler = AnimationItemHandler;
    }());
}
