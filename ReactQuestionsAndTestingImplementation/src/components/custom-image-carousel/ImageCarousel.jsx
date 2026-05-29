import React, { useCallback, useEffect, useState, useRef } from "react";
import "./ImageCarousel.css";

const THUMB_WIDTH = 225; // must match .thumb width in CSS
const GAP = 12; // must match .track gap in CSS
const THUMB_STEP = THUMB_WIDTH + GAP;

function ImageCarousel() {
  const [visibleCount, setVisibleCount] = useState(1);
  const viewportRef = useRef(null);
  const [windowStart, setWindowStart] = useState(0);
  const [duration, setDuration] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isForward, setIsForward] = useState(true);
  const [imageList, setImageList] = useState([]);
  const [indexOfSelectedImage, setIndexOfSelectedImage] = useState(0);

  const getDataFromAPI = useCallback(async () => {
    const response = await fetch("./image.json");
    const data = await response.json();
    setImageList(data?.images ?? []);
  }, []);

  useEffect(() => {
    getDataFromAPI();
  }, [getDataFromAPI]);

  /**
   * very important hook which calculates, how many images will fit in
   * viewport at a time.
   */
  useEffect(() => {
    const viewportElement = viewportRef.current;
    if (!viewportElement) return;

    const update = () => {
      const width = viewportElement.clientWidth;
      const howManyElementFitInViewPort = Math.floor(width / THUMB_STEP);
      setVisibleCount(Math.max(1, howManyElementFitInViewPort));
    };
    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(viewportElement);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const maxStart = Math.max(0, imageList.length - visibleCount);
    setWindowStart((prev) => Math.min(prev, maxStart));
  }, [visibleCount, imageList.length]);

  useEffect(() => {
    if (!isRunning || !duration || imageList.length === 0) return;

    const interval = setInterval(() => {
      setIndexOfSelectedImage((prev) => {
        return isForward
          ? prev < imageList.length - 1
            ? prev + 1
            : 0
          : prev > 0
            ? prev - 1
            : imageList.length - 1;
      });
    }, duration * 1000);
    return () => {
      /**
       * The full rule
       * A cleanup function runs in two scenarios, not just unmount:
       * 1. Before the effect runs again (because a dependency changed).
       * 2. On unmount.
       */
      clearInterval(interval);
    };
  }, [isRunning, duration, imageList, isForward]);

  const handleForward = useCallback((forward) => {
    setIsForward(forward);
    setIsRunning(false);
  }, []);

  const handleClick = useCallback(
    (isForward) => {
      setIsRunning(false);
      setIndexOfSelectedImage((prev) => {
        return isForward
          ? prev < imageList.length - 1
            ? prev + 1
            : 0
          : prev > 0
            ? prev - 1
            : imageList.length - 1;
      });
    },
    [imageList],
  );

  const startRotation = () => {
    setIsRunning(true);
  };

  const stopRotation = () => {
    setIsRunning(false);
  };

  const handleDurationChange = (event) => {
    setDuration(event.target.value);
  };

  const offsetPx = windowStart * THUMB_STEP;

  const handleThumbForward = () => {
    if (indexOfSelectedImage >= imageList.length - 1) return;
    const next = indexOfSelectedImage + 1;
    setIndexOfSelectedImage(next);
    if (next > windowStart + visibleCount - 1) {
      setWindowStart(next - visibleCount + 1);
    }
  };

  const handleThumbBackward = () => {
    if (indexOfSelectedImage <= 0) return;
    const prev = indexOfSelectedImage - 1;
    setIndexOfSelectedImage(prev);
    if (prev < windowStart) {
      setWindowStart(prev);
    }
  };

  const renderGallery = () => {
    return (
      <div>
        <h2>Gallery - Image {indexOfSelectedImage + 1}</h2>
        <div className="projected-image">
          <button className="less-than" onClick={() => handleClick(false)}>
            &lt;
          </button>
          <img
            className="projected-image-container"
            src={imageList[indexOfSelectedImage]}
            alt={`Image`}
          />
          <button className="greater-than" onClick={() => handleClick(true)}>
            &gt;
          </button>
        </div>
        <div className="carousel-row">
          <button
            className="nav-btn"
            disabled={indexOfSelectedImage === 0}
            onClick={handleThumbBackward}
          >
            &lt;
          </button>
          <div className="viewport" ref={viewportRef}>
            <div
              className="track"
              style={{ transform: `translateX(-${offsetPx}px)` }}
            >
              {imageList.map((image, index) => {
                return (
                  <img
                    className={
                      indexOfSelectedImage === index
                        ? "thumb thumb-selected"
                        : "thumb"
                    }
                    key={index}
                    src={image}
                    alt={`Image number ${index + 1}`}
                  />
                );
              })}
            </div>
          </div>
          <button
            className="nav-btn"
            onClick={handleThumbForward}
            disabled={indexOfSelectedImage >= imageList.length - 1}
          >
            &gt;
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="image-top-container">
      <h1> Image Carousel !!!</h1>
      <div>
        <span>Duration (Image stays at screen in seconds): </span>
        <input
          type="text"
          placeholder="Enter in seconds"
          value={duration}
          onChange={handleDurationChange}
        />
      </div>
      <br />
      <div>
        <span>Direction of movement:</span>
        <input
          type="radio"
          checked={isForward}
          onChange={() => handleForward(true)}
        />{" "}
        Forward
        <input
          type="radio"
          checked={!isForward}
          onChange={() => handleForward(false)}
        />{" "}
        Backward
      </div>
      <br />
      <button
        style={{ cursor: "pointer" }}
        type="button"
        onClick={startRotation}
      >
        Start Auto Rotate
      </button>
      <button
        type="button"
        style={{ cursor: "pointer" }}
        onClick={stopRotation}
      >
        Stop Auto Rotate
      </button>
      {renderGallery()}
    </div>
  );
}

export default ImageCarousel;

/**
 * below: Same implementation using refs
 */

// import React, { useCallback, useEffect, useState, useRef } from "react";
// import "./ImageCarousel.css";

// function ImageCarousel() {
//   const [duration, setDuration] = useState("");
//   const [isRunning, setIsRunning] = useState(false);
//   const [isForward, setIsForward] = useState(true);
//   const isForwardRef = useState(isForward);
//   const [imageList, setImageList] = useState([]);
//   const imageListRef = useRef(imageList);
//   const [indexOfSelectedImage, setIndexOfSelectedImage] = useState(0);
//   let timeInterval = useRef(null);

//   const getDataFromAPI = useCallback(async () => {
//     const response = await fetch("./image.json");
//     const data = await response.json();
//     setImageList(data?.images ?? []);
//   }, []);

//   useEffect(() => {
//     getDataFromAPI();
//   }, [getDataFromAPI]);

//   useEffect(() => {
//     isForwardRef.current = isForward;
//     imageListRef.current = imageList;
//   });

//   useEffect(() => {
//     return () => {
//       clearInterval(timeInterval.current);
//     };
//   }, []);

//   const handleForward = useCallback((forward) => {
//     setIsForward(forward);
//     clearInterval(timeInterval.current);
//     setIsRunning(false);
//   }, []);

//   const handleClick = useCallback(
//     (isForward) => {
//       setIndexOfSelectedImage((prev) => {
//         return isForward
//           ? prev < imageList.length - 1
//             ? prev + 1
//             : 0
//           : prev > 0
//             ? prev - 1
//             : imageList.length - 1;
//       });
//     },
//     [imageList],
//   );

//   const startRotation = () => {
//     if (!duration || isRunning) return;
//     timeInterval.current = setInterval(() => {
//       setIndexOfSelectedImage((prev) => {
//         if (imageListRef.current.length === 0) return prev;
//         setIsRunning(true);
//         return isForwardRef.current
//           ? prev < imageListRef.current.length - 1
//             ? prev + 1
//             : 0
//           : prev > 0
//             ? prev - 1
//             : imageListRef.current.length - 1;
//       });
//     }, duration * 1000);
//   };

//   const stopRotation = () => {
//     clearInterval(timeInterval.current);
//     setIsRunning(false);
//   };

//   const handleDurationChange = (event) => {
//     setDuration(event.target.value);
//   };

//   const renderImage = () => {
//     return (
//       <div>
//         <h2>Gallery</h2>
//         <div className="projected-image">
//           <button className="less-than" onClick={() => handleClick(false)}>
//             &lt;
//           </button>
//           <img
//             className="projected-image-container"
//             src={imageList[indexOfSelectedImage]}
//             alt={`Image`}
//           />
//           <button className="greater-than" onClick={() => handleClick(true)}>
//             &gt;
//           </button>
//         </div>
//         <div>
//           <button className="backward" onClick={() => handleClick(false)}>
//             &lt;
//           </button>
//           {imageList.map((image, index) => {
//             return (
//               <img
//                 className={
//                   indexOfSelectedImage === index
//                     ? "selected-image highlighted"
//                     : "selected-image"
//                 }
//                 key={index}
//                 src={image}
//                 alt={`Image number ${index + 1}`}
//               />
//             );
//           })}
//           <button className="forward" onClick={() => handleClick(true)}>
//             &gt;
//           </button>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="image-top-container">
//       <h1> Image Carousel !!!</h1>
//       <div>
//         <span>Duration (Image stays at screen in seconds): </span>
//         <input
//           type="text"
//           placeholder="Enter in seconds"
//           value={duration}
//           onChange={handleDurationChange}
//         />
//       </div>
//       <br />
//       <div>
//         <span>Direction of movement:</span>
//         <input
//           type="radio"
//           checked={isForward}
//           onChange={() => handleForward(true)}
//         />{" "}
//         Forward
//         <input
//           type="radio"
//           checked={!isForward}
//           onChange={() => handleForward(false)}
//         />{" "}
//         Backward
//       </div>
//       <br />
//       <button
//         style={{ cursor: "pointer" }}
//         type="button"
//         onClick={startRotation}
//       >
//         Start Auto Rotate
//       </button>
//       <button
//         type="button"
//         style={{ cursor: "pointer" }}
//         onClick={stopRotation}
//       >
//         Stop Auto Rotate
//       </button>
//       {renderImage()}
//     </div>
//   );
// }

// export default ImageCarousel;
