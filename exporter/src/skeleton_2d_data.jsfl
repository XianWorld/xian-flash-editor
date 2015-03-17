/**
 * Created with WebStorm.
 * User: Dianyan
 * Date: 2015/3/2
 * Time: 20:20
 * To change this template use File | Settings | File Templates.
 */

"use strict";
if (typeof Xian !== 'object') {
    Xian = {};
}
if (!Xian.Skeleton2DData) {

    (function () {
        fl.runScript(Xian.scriptDirURI + 'utils.jsfl');
        var Utils = Xian.Utils;

        function Skeleton2DData() {
            this.name = undefined;
            this.width = 0;
            this.height = 0;
            this.version = undefined;
            this.hash = undefined;

            this.bones = [];
            this.boneHash = {};

            this.slots = [];
            this.slotHash = {};

            this.skins = [];
            this.skinHash = {};

            //this.events = [];
            this.animations = [];
            this.animationHash = {};
        }

        Skeleton2DData.prototype.toJSON = function (json) {
            json || (json = {});

            var i;

            json.bones || (json.bones = []);
            for (i = 0; i < this.bones.length; i++) {
                json.bones.push(this.bones[i].toJSON());
            }

            json.slots || (json.slots = []);
            for (i = 0; i < this.slots.length; i++) {
                json.slots.push(this.slots[i].toJSON());
            }

            json.skins || (json.skins = {});
            for (i = 0; i < this.skins.length; i++) {
                json.skins[this.skins[i].name] = this.skins[i].toJSON();
            }

            json.animations || (json.animations = {});
            for (i = 0; i < this.animations.length; i++) {
                json.animations[this.animations[i].name] = this.animations[i].toJSON();
            }
            return json;
        };

        Skeleton2DData.prototype.getBone = function (boneName) {
            return this.boneHash[boneName];
        };
        Skeleton2DData.prototype.addBone = function (boneData) {
            this.boneHash[boneData.name] = boneData;
            this.bones.push(boneData);
        };
        Skeleton2DData.prototype.getSlot = function (slotName) {
            return this.slotHash[slotName];
        };
        Skeleton2DData.prototype.addSlot = function (slotData) {
            this.slotHash[slotData.name] = slotData;
            this.slots.push(slotData);
        };
        Skeleton2DData.prototype.bringSlotToTop = function (slotData) {
            var slots = this.slots;
            var index = slots.indexOf(slotData);
            if (index >= 0)
                slots.splice(index, 1);
            this.slots.push(slotData);
        };
        Skeleton2DData.prototype.getSkin = function (skinName) {
            return this.skinHash[skinName];
        };
        Skeleton2DData.prototype.addSkin = function (skinData) {
            this.skinHash[skinData.name] = skinData;
            this.skins.push(skinData);
        };

        Skeleton2DData.prototype.getAttachment = function (skinName, slotName, attachmentName) {
            var skinData = this.getSkin(skinName);
            if (!skinData) return undefined;
            return skinData.getAttachment(slotName, attachmentName);
        };

        Skeleton2DData.prototype.addAttachment = function (skinName, attachment) {
            var skinData = this.getSkin(skinName);
            if (!skinData) return;
            skinData.addAttachment(attachment);
        };

        Skeleton2DData.prototype.getAnimation = function (animationName) {
            return this.animationHash[animationName];
        };
        Skeleton2DData.prototype.addAnimation = function (animationData) {
            this.animationHash[animationData.name] = animationData;
            this.animations.push(animationData);
        };

        function Bone2DData(name) {
            this.name = name;
            this.parent = null;
            this.length = 0;

            this.x = 0;
            this.y = 0;
            this.rotation = 0;
            this.scaleX = 1;
            this.scaleY = 1;
            this.skewX = 0;
            this.skewY = 0;
            //this.inheritScale = true;
            //this.inheritRotation = true;
            //this.flipX = false;
            //this.flipY = false;
        }

        Bone2DData.prototype.toJSON = function (json) {
            json || (json = {});

            json.name = this.name;
            if (this.parent)
                json.parent = this.parent;
            if (this.length > 0)
                json.length = this.length;
            if (this.x != 0) json.x = this.x;
            if (this.y != 0) json.y = this.y;
            if (this.rotation != 0) json.rotation = this.rotation;
            if (this.scaleX != 1) json.scaleX = this.scaleX;
            if (this.scaleY != 1) json.scaleY = this.scaleY;
            if (this.skewX != 0) json.skewX = this.skewX;
            if (this.skewY != 0) json.skewY = this.skewY;

            return json;
        };


        function Slot2DData(name, boneData) {
            this.name = name;
            this.boneData = boneData;
            this.r = 1;
            this.g = 1;
            this.b = 1;
            this.a = 1;
            this.attachmentName = null;
            this.additiveBlending = false;

            //this.skinData = undefined;
        }

        Slot2DData.prototype.toJSON = function (json) {
            json || (json = {});

            json.name = this.name;
            if (this.boneData)
                json.bone = this.boneData.name;
            if (this.attachmentName)
                json.attachment = this.attachmentName;// + "0000";

            return json;
        };

        function SkinData(name) {
            this.name = name;
            //this.attachments = {};
            this.slotAttachmentHash = {};
        }

        SkinData.prototype.toJSON = function (json) {
            json || (json = {});

            var attachmentData;
            var attachmentName;
            //json.name = this.name;
            for (var slotName in this.slotAttachmentHash) {
                var attachments = this.slotAttachmentHash[slotName];
                var attachmentHash = {};
                //for(var i = 0;i<attachments.length;i++){
                for (var aname in attachments) {
                    //attachmentData = attachments[i];
                    attachmentData = attachments[aname];
                    attachmentName = attachmentData.name;// + "0000";
                    attachmentHash[attachmentName] = attachmentData.toJSON();
                }
                json[slotName] = attachmentHash;
            }

            return json;
        };

        SkinData.prototype.addAttachment = function (attachment) {
            //this.attachments[attachment.name] = attachment;
            if (attachment.slotData) {
                var slotName = attachment.slotData.name;
                var as = this.slotAttachmentHash[slotName];
                if (!as) {
                    as = this.slotAttachmentHash[slotName] = {};
                }
                //as.push(attachment);
                as[attachment.name] = attachment;
            }
        };
        SkinData.prototype.getAttachment = function (slotName, name) {
            var as = this.slotAttachmentHash[slotName];
            if (as)
                return as[name];
            return undefined;
            //return this.attachments[name];
        };

        var AttachmentType = {
            region: 0,
            boundingbox: 1,
            mesh: 2,
            skinnedmesh: 3
        };

        function RegionAttachmentData(name) {
            this.name = name;
            this.slotData = undefined;

            this.type = AttachmentType.region;
            this.x = 0;
            this.y = 0;
            this.rotation = 0;
            this.scaleX = 1;
            this.scaleY = 1;
            this.skewX = 0;
            this.skewY = 0;
            this.width = 0;
            this.height = 0;
            this.r = 1;
            this.g = 1;
            this.b = 1;
            this.a = 1;
        }

        RegionAttachmentData.prototype.toJSON = function (json) {
            json || (json = {});

            //json.name = this.name;
            if (this.x != 0) json.x = this.x;
            if (this.y != 0) json.y = this.y;
            if (this.rotation != 0) json.rotation = this.rotation;
            if (this.scaleX != 1) json.scaleX = this.scaleX;
            if (this.scaleY != 1) json.scaleY = this.scaleY;
            if (this.skewX != 0) json.skewX = this.skewX;
            if (this.skewY != 0) json.skewY = this.skewY;
            if (this.width != 0) json.width = this.width;
            if (this.height != 0) json.height = this.height;

            return json;
        };

        function Animation2DData(name) {
            this.name = name;
            this.boneTimelineDataHash = undefined;
            this.slotTimelineDataHash = undefined;
            //this.duration = duration;
        }
        Animation2DData.prototype.toJSON = function (json) {
            json || (json = {});
            if (this.boneTimelineDataHash)
                json.bones = this.boneTimelineDataHash;
            if (this.slotTimelineDataHash)
                json.slots = this.slotTimelineDataHash;
            return json;
        };

        function BoneTimelineData() {
            this.translateFrames = [];
            this.rotateFrames = [];
            this.scaleFrames = [];
        }
        BoneTimelineData.prototype.toJSON = function (json) {
            json || (json = {});
            if (this.translateFrames.length > 0)
                json.translate = this.translateFrames;
            if (this.rotateFrames.length > 0)
                json.rotate = this.rotateFrames;
            if (this.scaleFrames.length > 0)
                json.scale = this.scaleFrames;
            return json;
        };
        BoneTimelineData.prototype.addTranslateFrame = function (time, x, y) {
            var data;
            var frames = this.translateFrames;
            var add = false;
            var len = frames.length;
            if (len == 0)
                add = true;
            else {
                data = frames[len - 1];
                if (Utils.compareValue(data.x, x, 2) !== 0)
                    add = true;
                if (Utils.compareValue(data.y, y, 2) !== 0)
                    add = true;
            }
            if (!add) return false;
            frames.push({"time": time, "x": x, "y": y});
            return true;
        };
        BoneTimelineData.prototype.addRotateFrame = function (time, rotation, skewX, skewY) {
            var data;
            var frames = this.rotateFrames;
            var add = false;
            var len = frames.length;
            if (len == 0) {
                //if (Utils.compareValue(0.0, rotation, 0.2) !== 0)
                //    add = true;
                //if (Utils.compareValue(0.0, skewX, 0.2) !== 0)
                //    add = true;
                //if (Utils.compareValue(0.0, skewY, 0.2) !== 0)
                //    add = true;
                add = true;
            }
            else {
                data = frames[len - 1];
                if (Utils.compareValue(data.angle, rotation, 0.2) !== 0)
                    add = true;
                if (Utils.compareValue(data.skewX, skewX, 0.2) !== 0)
                    add = true;
                if (Utils.compareValue(data.skewY, skewY, 0.2) !== 0)
                    add = true;
            }
            if (!add) return false;
            frames.push({"time": time, "angle": rotation, "skewX": skewX, "skewY": skewY});
            return true;
        };
        BoneTimelineData.prototype.addScaleFrame = function (time, x, y) {
            var data;
            var frames = this.scaleFrames;
            var add = false;
            var len = frames.length;
            if (len == 0) {
                if (Utils.compareValue(x, 1.0, 0.02) !== 0)
                    add = true;
                if (Utils.compareValue(y, 1.0, 0.02) !== 0)
                    add = true;
            }
            else {
                data = frames[len - 1];
                if (Utils.compareValue(data.x, x, 0.02) !== 0)
                    add = true;
                if (Utils.compareValue(data.y, y, 0.02) !== 0)
                    add = true;
            }
            if (!add) return false;
            frames.push({"time": time, "x": x, "y": y});
            return true;
        };

        function SlotTimelineData() {
            this.drawOrderFrames = [];
            this.attachmentFrames = [];
            this.colorFrames = [];
        }
        SlotTimelineData.prototype.toJSON = function (json) {
            json || (json = {});
            if (this.drawOrderFrames.length > 0)
                json.drawOrder = this.drawOrderFrames;
            if (this.attachmentFrames.length > 0)
                json.attachment = this.attachmentFrames;
            if (this.colorFrames.length > 0)
                json.color = this.colorFrames;
            return json;
        };
        SlotTimelineData.prototype.addDrawOrderFrame = function (time, index) {
            var data;
            var frames = this.drawOrderFrames;
            var add = false;
            var len = frames.length;
            if (len == 0)
                add = true;
            else {
                data = frames[len - 1];
                if (Utils.compareValue(data.index, index) !== 0)
                    add = true;
            }
            if (!add) return false;
            frames.push({"time": time, "index": index});
            return true;
        };
        SlotTimelineData.prototype.addAttachmentFrame = function (time, name) {
            var data;
            var frames = this.attachmentFrames;
            var add = false;
            var len = frames.length;
            if (len == 0)
                add = true;
            else {
                data = frames[len - 1];
                if (data.name != name)
                    add = true;
            }
            if (!add) return false;
            frames.push({"time": time, "name": name});
            return true;
        };
        SlotTimelineData.prototype.addColorFrame = function (time, r, g, b, a) {
            var data;
            var frames = this.colorFrames;
            var add = false;
            var len = frames.length;
            r = r & 0xff;
            g = g & 0xff;
            b = b & 0xff;
            a = a & 0xff;
            if (len == 0) {
                if (Utils.compareValue(0, a, 2) !== 0)
                    add = true;
            }
            else {
                data = frames[len - 1];
                if (Utils.compareValue(data.r, r, 2) !== 0)
                    add = true;
                if (Utils.compareValue(data.g, g, 2) !== 0)
                    add = true;
                if (Utils.compareValue(data.b, b, 2) !== 0)
                    add = true;
                if (Utils.compareValue(data.a, a, 2) !== 0)
                    add = true;
            }
            if (!add) return false;
            //var color = (a<<24) | (r<<16) | (g<<8) | (b);
            //var colorString = Utils.color32HexString(color);
            frames.push({"time": time, "r": r, "g": g, "b": b, "a": a});
            return true;
        };

        //function TranslateTimelineData() {
        //    this.frames = [];
        //}
        ////TranslateTimelineData.prototype.toJSON = function (json) {
        ////    json || (json = {});
        ////    json.translate = this.frames;
        ////    return json;
        ////};
        //TranslateTimelineData.prototype.addFrame = function (time, x, y) {
        //    var data;
        //    var frames = this.frames;
        //    var add = false;
        //    var len = frames.length;
        //    if (len == 0)
        //        add = true;
        //    else {
        //        data = frames[len - 1];
        //        if (Utils.compareValue(data.x, x, 1) !== 0)
        //            add = true;
        //        if (Utils.compareValue(data.y, y, 1) !== 0)
        //            add = true;
        //    }
        //    if (!add) return false;
        //    frames.push({"time": time, "x": x, "y": y});
        //    return true;
        //};

        Xian.Skeleton2DData = Skeleton2DData;
        Xian.Bone2DData = Bone2DData;
        Xian.Slot2DData = Slot2DData;
        //XianData.IkConstraint2DData = IkConstraint2DData;
        Xian.SkinData = SkinData;
        Xian.AttachmentType = AttachmentType;
        Xian.RegionAttachmentData = RegionAttachmentData;

        Xian.Animation2DData = Animation2DData;
        Xian.BoneTimelineData = BoneTimelineData;
        Xian.SlotTimelineData = SlotTimelineData;
        //Xian.TranslateTimelineData = TranslateTimelineData;
    }());

}