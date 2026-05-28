import { useState } from "react";
import "../../App.css";

const ratingCount = 5;

function Rating() {
  const [selectedStar, setSelectedStar] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);

  const handleOnClick = (selected) => {
    setSelectedStar(selected);
  };
  const handleMouseOver = (selected) => {
    setHoverStar(selected);
  };
  const handleMouseLeave = () => {
    setHoverStar(selectedStar);
  };

  const activeStar = hoverStar > 0 ? hoverStar : selectedStar;

  return (
    <div style={{ border: "1px solid black", padding: "24px", margin: "24px" }}>
      <h1>Rating !!!</h1>
      <div onMouseLeave={handleMouseLeave}>
        {Array.from({ length: ratingCount }).map((_, index) => {
          return (
            <button
              type="button"
              aria-label={`Rate ${index + 1} out of ${ratingCount}`}
              key={index}
              className={`star ${index < activeStar ? "star-selected" : ""}`}
              onMouseEnter={() => handleMouseOver(index + 1)}
              onClick={() => handleOnClick(index + 1)}
            >
              {"\u2605"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Rating;
