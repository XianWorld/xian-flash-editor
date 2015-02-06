/**
 * Created by Dianyan on 2015/2/5.
 */

var fs = require('fs');
var ByteBuffer = require('bytebuffer');

var utils = require('./src/utils');

function fileTest() {
    var argObj = utils.getProcessArgvData();
    var srcPath = argObj.src;
    var destPath = argObj.dest;
    if (!srcPath) return;

    if(srcPath.charAt(srcPath.length-1) === '\\') srcPath = srcPath.substring(0, srcPath.length-1);
    if(destPath && destPath.charAt(destPath.length-1) === '\\') destPath = destPath.substring(0, destPath.length-1);

    var stats = fs.statSync(srcPath);
    if (!stats) return;

    if (!destPath) {
        if (stats.isFile()) {
            var index = srcPath.lastIndexOf('\\');
            if (index === -1) {
                destPath = '';
            }
            else {
                destPath = srcPath.substring(0, index);
            }
        }
        else {
            destPath = srcPath;
        }
    }
    console.log(srcPath);
    console.log(destPath);

    extractFile(srcPath, destPath);
}

function extractFile(srcPath, destPath, fileName) {
    //fileName = fileName || '';
    var stats = fs.statSync(srcPath);
    if (!stats) return;

    if (stats.isFile()) {
        if(srcPath.indexOf('.d2p') === -1) return;
        extractD2P(srcPath, destPath);
    }
    else {
        if(fileName) destPath = destPath + '\\' + fileName;
        var files = fs.readdirSync(srcPath);
        var i;
        for (i = 0; i < files.length; i++) {
            extractFile(srcPath + '\\' + files[i], destPath, files[i]);
            console.log(files[i]);
        }
    }
}

function extractD2P(srcFilePath, destDirPath) {
    var srcFileName = '';
    var index = srcFilePath.lastIndexOf('\\');
    if (index === -1) {
        //if (!destDirPath) destDirPath = '';
        srcFileName = srcFilePath;
    }
    else {
        //if (!destDirPath) destDirPath = srcFilePath.substring(0, index + 1);
        srcFileName = srcFilePath.substring(index + 1, srcFilePath.length);
    }

    srcFileName = srcFileName.split('.')[0];
    destDirPath +=  '\\' +srcFileName;
    console.log(destDirPath);
    if (!fs.existsSync(destDirPath)) {
        fs.mkdirSync(destDirPath);
    }

    var buffer = fs.readFileSync(srcFilePath);
    console.log(buffer);

    var byteBuffer = ByteBuffer.wrap(buffer);
    console.log(byteBuffer.limit);

    var vMax = byteBuffer.readUint8();
    var vMin = byteBuffer.readUint8();
    if (vMax != 2 || vMin != 1) {
        throw new Error("invalid d2p version : " + vMax + "." + vMin);
    }
    byteBuffer.offset = byteBuffer.limit - 24;
    var dataOffset = byteBuffer.readUint32();
    var dataCount = byteBuffer.readUint32();
    var indexOffset = byteBuffer.readUint32();
    var indexCount = byteBuffer.readUint32();
    var propertiesOffset = byteBuffer.readUint32();
    var propertiesCount = byteBuffer.readUint32();
    byteBuffer.offset = indexOffset;

    var _fileList = [];
    var filePath;
    var fileOffset;
    var fileLength;
    var temp, flag;
    var i, j;
    for (i = 0; i < indexCount; i++) {
        temp = byteBuffer.readUint16();
        filePath = byteBuffer.readUTF8String(temp);
        fileOffset = byteBuffer.readInt();
        fileLength = byteBuffer.readInt();
        _fileList.push({p: filePath, o: fileOffset + dataOffset, l: fileLength});

        console.log('filePath: ' + filePath + ", fileOffset: " + (fileOffset + dataOffset) + ", fileLength: " + fileLength);
    }

    var fileData;
    var fd;
    for (i = 0; i < indexCount; i++) {
        fileData = _fileList[i];

        filePath = destDirPath + '\\' + fileData.p;
        fileOffset = fileData.o;
        fileLength = fileData.l;

        temp = destDirPath;
        var aa = fileData.p.split('/');
        for (j = 0; j < aa.length - 1; j++) {
            temp += '\\' + aa[j];
            if (!fs.existsSync(temp)) {
                fs.mkdirSync(temp);
            }
        }

        fd = fs.openSync(filePath, 'w');
        fs.writeSync(fd, byteBuffer.buffer, fileOffset, fileLength);
        fs.closeSync(fd);

        try {

            index = fileData.p.lastIndexOf('.swl');
            if (index >= 0) {
                filePath = destDirPath + '\\' + fileData.p.substring(0, index) + '.swf';
                byteBuffer.offset = fileOffset;

                flag = byteBuffer.readByte();
                if (flag === 76) {
                    var version = byteBuffer.readByte();
                    var frameRate = byteBuffer.readUint32();
                    var classesCount = byteBuffer.readInt();

                    console.log(filePath + ': ' + version + ', ' + frameRate + ', ' + classesCount);

                    var classesList = [];
                    for (j = 0; j < classesCount; j++) {
                        temp = byteBuffer.readUint16();
                        //console.log(temp);
                        var ss = byteBuffer.offset;
                        var animName = byteBuffer.readUTF8String(temp);
                        if ((byteBuffer.offset - ss) != temp)
                            byteBuffer.offset = ss + temp;
                        classesList.push(animName);
                        //console.log(animName);
                    }

                    fileLength = fileLength - (byteBuffer.offset - fileOffset);
                    fileOffset = byteBuffer.offset;
                    fd = fs.openSync(filePath, 'w');
                    fs.writeSync(fd, byteBuffer.buffer, fileOffset, fileLength);
                    fs.closeSync(fd);
                }
                else {
                    console.log('Malformated library file (wrong header).');
                }
            }
        }
        catch (e) {
            console.log(e);
        }
    }

}

fileTest();