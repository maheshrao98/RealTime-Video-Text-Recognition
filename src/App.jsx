import React, { useEffect, useRef } from 'react';
import { createWorker } from 'tesseract.js';

const worker = createWorker();

// video config
const vidWidth = window.innerWidth - 60; // can be controlled
const vidHeight = 260; // can be controlled
const vidOffsetTop = 240; // can be controlled
const vidOffsetLeft = ((window.innerWidth) / 3) - (vidWidth / 2); // is centered, but if you want to change also can

// indicator config
const marginX = 40; // margin left and right, can be controlled
const indWidth = vidWidth - marginX; // 100% width - margin, can be changed if you want
const indHeight = 80; // can be controlled
const indOffsetTop = vidOffsetTop + (vidHeight / 2) - (indHeight / 2); // is centered, if you want to change also can
const indOffsetLeft = (window.innerWidth / 2) - (indWidth / 2); // is centered, if you want to change also can

const App = ({ setCode, setScanning }) => {
    const myVideo = useRef();
    const myStream = useRef();
    const scannedCodes = useRef();

    useEffect(() => {
        if (myVideo && myVideo.current) {
            navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: false
            })
            .then(stream => {
                myVideo.current.srcObject = stream;
                myVideo.current.play();
    
                myStream.current = stream;
                scannedCodes.current = {};
    
                (async () => {
                    await worker.load();
                    await worker.loadLanguage("eng");
                    await worker.initialize("eng");
                    requestAnimationFrame(tick);
                })()
            })
            .catch(err => {
                console.error(err);
                // handle error here with popup
            })
        }

        return () => myStream && myStream.current && myStream.current.getTracks().forEach(x => x.stop());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const tick = async () => {
        if (myVideo && myVideo.current && myVideo.current.readyState === myVideo.current.HAVE_ENOUGH_DATA) {
            // canvas
            const canvas = document.createElement("canvas");
            canvas.width = indWidth;
            canvas.height = indHeight;

            const image = myVideo.current;
            // source 
            const sx = (marginX / 2) / 2;
            const sy = vidHeight - indHeight;
            const sWidth = indWidth * 2;
            const sHeight = indHeight * 2;
            // destination
            const dx = 0;
            const dy = 0;
            const dWidth = indWidth;
            const dHeight = indHeight;

            canvas.getContext("2d")
            .drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

            // tesseract
            const { data: { text } } = await worker.recognize(canvas);
            const regex = /[a-zA-Z0-9]/gi;
            const scannedText = text && text.match(regex) && text.match(regex).filter(x => x).join("");
            console.log({text, scannedText});
            requestAnimationFrame(tick);
        }
    };

    return (
        <div>
            <video
                ref={myVideo}
                autoPlay
                muted
                playsInline
                width={vidWidth}
                height={vidHeight}
                style={{
                    position: "absolute",
                    top: vidOffsetTop,
                    left: vidOffsetLeft,
                    zIndex: 2
                }}
            ></video>
            <div
                style={{
                    width: indWidth,
                    height: indHeight,
                    border: "1px red solid",
                    zIndex: 3,
                    position: "absolute",
                    top: indOffsetTop,
                    left: indOffsetLeft
                }}
            ></div>
        </div>
    )
};

export default App;