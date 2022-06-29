import fs from 'fs';
import express from 'express';
import raspberryPiCamera from 'raspberry-pi-camera-native';

const app = express();

let lastFrameObj = { lastFrame: null };
raspberryPiCamera.start({
    width: 1920,
    height: 1080,
    fps: 30,
    quality: 100,
    encoding: 'JPEG'
});

app.get('/stream', (req, res) => {
    res.writeHead(200, {
        Pragma: 'no-cache',
        Connection: 'close',
        'Cache-Control': 'no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0',
        'Content-Type': 'multipart/x-mixed-replace; boundary=--myboundary'
    });

    let isReady = true;
    let frameHandler = (frameData) => {
        try{
            if(!isReady){
                return;
            }
            isReady = false;
            lastFrameObj.lastFrame = frameData;
            res.write(`--myboundary\nContent-Type: image/jpg\nContent-length: ${frameData.length}\n\n`);
            res.write(frameData, () => {
                isReady = true;
            });
        }
        catch(e){}
    }
    let frameEmitter = raspberryPiCamera.on('frame', frameHandler);

    req.on('close',() => {
        frameEmitter.removeListener('frame', frameHandler);
    });
});

app.get('/take/:nameFile', (req, res) => {
    raspberryPiCamera.once('frame', (data) => {
        const fileName = `${req.params.nameFile}.jpg`;
        const filePath = `photos/${fileName}`;

        fs.writeFile(filePath, data,() => {
           console.log(`File-Write ${fileName}`);
        });
        res.end(data);
    });
});

app.get('/list', (req, res) => {
    const dir = fs.opendirSync('photos');
    let entity;
    let listing = [];

    while((entity = dir.readSync()) !== null) {
        if(entity.isFile()) {
            listing.push({ type: 'File:', name: entity.name, link: 'http://192.168.1.151:8181/get/' + entity.name })
        } else if(entity.isDirectory()) {
            listing.push({ type: 'Folder:', name: entity.name })
        }
    }
    dir.closeSync()
    res.send(listing)
});

app.get('/get/:nameFile', (req, res) => {
    const fileName = `${req.params.nameFile}`;
    const filePath = `./photos/${fileName}`;
    const exist = fs.existsSync(filePath);

    if (exist) {
        res.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": "attachment; filename=" + fileName
        });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("ERROR File does not exist");
    }
});

app.listen(8181);
