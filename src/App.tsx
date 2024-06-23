import etro from "etro";
import { useEffect, useRef, useState } from "react";

const WIDTH = 400;
const HEIGHT = 400;

const useFileLoad = () => {
  const load = (accept: string, onLoad: (file: File) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;

    const handleFileSelect = (event: Event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const file = files[0];
        onLoad(file);
      }
    };

    input.addEventListener("change", handleFileSelect);
    input.click();
  };

  return { load };
};

function App() {
  const actx = useRef(new AudioContext());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [movie, setMovie] = useState<etro.Movie | null>(null);

  const fileLoader = useFileLoad();

  useEffect(() => {
    const resume = () => {
      if (actx.current.state === "suspended") {
        actx.current.resume();
      }
      document.removeEventListener("click", resume);
    };
    document.addEventListener("click", resume);
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const dpr = 1; //window.devicePixelRatio || 1;
      canvas.width = WIDTH * dpr;
      canvas.height = HEIGHT * dpr;
      canvas.style.width = `${WIDTH}px`;
      canvas.style.height = `${HEIGHT}px`;

      const mm = new etro.Movie({
        canvas: canvasRef.current,
        actx: actx.current,
        background: etro.parseColor("black"),
        repeat: false,
      });
      setMovie(mm);
    }
  }, [canvasRef]);

  const addColorLayer = () => {
    const layer = new etro.layer.Visual({
      startTime: 0,
      duration: 5,
      x: 0, // default: 0
      y: 0, // default: 0
      width: 300, // default: null (full width)
      height: 150, // default: null (full height)
      background: etro.parseColor("red"), // default: null (transparent)
      border: {
        // default: null (no border)
        color: etro.parseColor("black"),
        thickness: 2,
      },
      opacity: 0.3, // default: 1
    });
    movie?.layers.push(layer);
  };

  const addImageLayer = () => {
    // const layer = new etro.layer.Image({
    //   startTime: 0,
    //   duration: 5,
    //   source: "https://picsum.photos/id/237/150/300",
    // });
    // movie.current?.layers.push(layer);

    fileLoader.load("image/*", (file) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        if (fileReader.result) {
          const url = fileReader.result.toString();

          const m = movie;
          if (!m) return;

          const layer = new etro.layer.Image({
            startTime: m.duration,
            duration: 5,
            source: url,
            destX: 0,
            destY: 0,
          });

          layer.whenReady().then(() => {
            const cWidth = canvasRef.current!.width;
            const cHeight = canvasRef.current!.height;

            const imgWidth = layer.source.width;
            const imgHeight = layer.source.height;
            const ratio = imgWidth / imgHeight;
            let scale = 1;
            console.log("width", imgWidth);
            console.log("height", imgHeight);
            console.log("ratio", ratio);

            if (ratio > 1) {
              // landscape
              console.log("landscape");
              scale = cWidth / imgWidth;
            } else {
              // portrait
              console.log("portrait");
              scale = cHeight / imgHeight;
            }
            console.log("scale", scale);

            const scaledWidth = imgWidth * scale;
            const scaledHeight = imgHeight * scale;
            console.log("scaled width", scaledWidth);
            console.log("scaled height", scaledHeight);

            const offX = (cWidth - scaledWidth) / 2;
            const offY = (cHeight - scaledHeight) / 2;
            console.log("offX", offX);
            console.log("offY", offY);

            const effect = new etro.effect.Transform({
              matrix: new etro.KeyFrame(
                [
                  0,
                  new etro.effect.Transform.Matrix()
                    .scale(scale, scale)
                    .translate(offX, 0),
                ],
                [
                  5,
                  new etro.effect.Transform.Matrix()
                    .scale(scale, scale)
                    .translate(offX, offY),
                ]
              ),
            });
            layer.addEffect(effect);
          });

          m.layers.push(layer);
        }
      };
      fileReader.readAsDataURL(file);
    });
  };

  const addTextLayer = () => {
    movie?.layers.push(
      new etro.layer.Text({
        startTime: 0,
        duration: 5,
        text: "Hello World",
        x: 0, // default: 0
        y: 0, // default: 0
        width: 400, // default: null (full width)
        height: 400, // default: null (full height)
        opacity: 1, // default: 1
        color: etro.parseColor("white"), // default: new etro.Color(0, 0, 0, 1)
        font: "30px sans-serif", // default: '10px sans-serif'
        textX: 30, // default: 0
        textY: 30, // default: 0
        textAlign: "left", // default: 'left'
        textBaseline: "alphabetic", // default: 'alphabetic'
        textDirection: "ltr", // default: 'ltr'
        textStroke: {
          // default: null (no stroke)
          color: etro.parseColor("black"),
          position: etro.layer.TextStrokePosition.Outside, // default: TextStrokePosition.Outside
          thickness: 2, // default: 1
        },
      })
    );
  };

  const addVideoLayer = () => {
    fileLoader.load("video/*", (file) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        if (fileReader.result) {
          const url = fileReader.result.toString();

          const video = new etro.layer.Video({
            startTime: 0,
            source: url,
          });

          video.whenReady().then(() => {
            const cWidth = canvasRef.current!.width;
            const cHeight = canvasRef.current!.height;
            const vWidth = video.source.videoWidth;
            const vHeight = video.source.videoHeight;
            const scale = cWidth / vWidth;
            const scaledHeight = vHeight * scale;
            const offY = (cHeight - scaledHeight) / 2;

            const effect = new etro.effect.Transform({
              matrix: new etro.effect.Transform.Matrix()
                .scale(scale, scale)
                .translate(0, offY),
            });
            video.addEffect(effect);
          });

          movie?.layers.push(video);
        }
      };
      fileReader.readAsDataURL(file);
    });

    // const layer = new etro.layer.Video({
    //   startTime: 0,
    //   source:
    //     "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    //   x: 0, // default: 0
    //   y: 0, // default: 0
    //   width: WIDTH, // default: null (full width)
    //   height: HEIGHT, // default: null (full height)
    //   playbackRate: 1,
    // });
    // movie.current?.layers.push(layer);
  };

  const addAudioLayer = () => {
    fileLoader.load("audio/*", (file) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        if (fileReader.result) {
          const url = fileReader.result.toString();

          const m = movie;
          if (m) {
            m.layers.push(
              new etro.layer.Audio({
                startTime: m.duration,
                source: url,
              })
            );
          }
        }
      };
      fileReader.readAsDataURL(file);
    });
  };

  const onPlay = () => {
    movie?.play().then(() => {
      console.log("Movie finished playing!");
    });
  };

  const onPause = () => {
    movie?.pause();
  };

  const onStop = () => {
    movie?.stop();
  };

  const onRecord = () => {
    movie
      ?.record({
        frameRate: 30,
      })
      .then((blob) => {
        console.log("Movie finished recording!");
        console.log("Blob:", blob);
      });
  };

  const onSeekFirst = () => {
    movie?.seek(0);
  };

  return (
    <>
      <div>
        <div>
          <canvas
            ref={canvasRef}
            className="scene"
            width={WIDTH}
            height={HEIGHT}
            style={{ border: "1px solid black" }}
          />
        </div>
        <DisplayTime movie={movie} />
        <div>
          <button onClick={addColorLayer}>Add Color Layer</button>
          <button onClick={addImageLayer}>Add Image Layer</button>
          <button onClick={addTextLayer}>Add Text Layer</button>
          <button onClick={addVideoLayer}>Add Video Layer</button>
          <button onClick={addAudioLayer}>Add Audio Layer</button>
        </div>
        <div>
          <button onClick={onSeekFirst}>{"|<"}</button>
          <button onClick={onPlay}>{"▶︎"}</button>
          <button onClick={onPause}>{"||"}</button>
          <button onClick={onStop}>{"◼︎"}</button>
          <button onClick={onRecord}>Record</button>
        </div>
      </div>
    </>
  );
}

const DisplayTime = ({ movie }: { movie: etro.Movie | null }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (movie) {
        setCurrentTime(movie.currentTime);
        setDuration(movie.duration);
      }
    }, 16);
    return () => clearInterval(intervalId);
  }, [movie]);

  return (
    <div>
      <span>{currentTime.toFixed(2)}</span>
      {" ~ "} <span>{duration.toFixed(2)}</span>
    </div>
  );
};

export default App;
