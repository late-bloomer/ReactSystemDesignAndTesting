import { useState } from "react";
import "./App.css";
import Rating from "./components/ratings/Rating";
import ProgressBar from "./components/progress-bar/ProgressBar";
import ImageCarousel from "./components/custom-image-carousel/ImageCarousel";
import ReactTesting from "./components/ReactTesting/ReactTesting";
import ClassComponent from "./components/ReactTesting/ClassComponentTesting";
import { Counter } from "./components/Counter";
import { Provider } from "react-redux";
import { store } from "./store/store";
function App() {
  return (
    <div className="app">
      <Rating />
      <ProgressBar />
      <ImageCarousel />
      <ReactTesting />
      <ClassComponent />
      <Provider store={store}>
        <Counter />
      </Provider>
    </div>
  );
}

export default App;
