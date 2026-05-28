import { useEffect, useState, useRef } from "react";
import "../../App.css";

function ProgressBar() {
  const WIDTH_OF_PROGRESSBAR = 400;
  const [isLoadingButton, setIsLoadingButton] = useState(false);
  const [progressDoneSoFar, setProgressDoneSoFar] = useState(0);
  let timeInterval = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timeInterval.current);
    };
  }, []);

  /**
   * on every click, progress increases by 10 %
   */
  const handleOnClick = () => {
    setIsLoadingButton(false);
    if (progressDoneSoFar < WIDTH_OF_PROGRESSBAR) {
      const updatedProgress = progressDoneSoFar + 400 * 0.1;
      setProgressDoneSoFar(updatedProgress);
    }
  };

  const handleLoadingBar = () => {
    /** using set interval  */
    /** 
      timeInterval.current = setInterval(() => {
        setProgressDoneSoFar((prev) => {
          if (prev < WIDTH_OF_PROGRESSBAR) {
            return prev + WIDTH_OF_PROGRESSBAR * 0.01;
          } else {
            clearInterval(timeInterval.current);
            return WIDTH_OF_PROGRESSBAR;
          }
        });
      }, 100);
    */

    /** best way and lets css handle the animation.. */
    setIsLoadingButton(true);
    setProgressDoneSoFar(WIDTH_OF_PROGRESSBAR);
  };

  const handleReset = () => {
    setIsLoadingButton(false);
    setProgressDoneSoFar(0);
  };

  const transitionStyle = isLoadingButton
    ? "width 4s linear"
    : "width 200ms linear";

  return (
    <div style={{ border: "1px solid black", padding: "24px", margin: "24px" }}>
      <h1>ProgressBar !!!</h1>
      <div
        className="progress-bar-container"
        style={{ width: `${WIDTH_OF_PROGRESSBAR}px` }}
      >
        <div
          className="progress-bar-child"
          style={{
            width: `${progressDoneSoFar}px`,
            transition: transitionStyle,
          }}
        ></div>
      </div>
      <br></br>
      <button
        type="button"
        onClick={handleOnClick}
        style={{ marginRight: "12px" }}
      >
        Click
      </button>
      <button
        type="button"
        onClick={handleLoadingBar}
        style={{ marginRight: "12px" }}
      >
        Loading Bar
      </button>
      <button type="button" onClick={handleReset}>
        Reset
      </button>
    </div>
  );
}

export default ProgressBar;
