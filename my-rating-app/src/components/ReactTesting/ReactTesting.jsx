import React, { useState } from "react";
import MyUser from "./MyUser";

function ReactTesting() {
  const [showMe, setShowMe] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [asyncText, setAsyncText] = useState("");
  return (
    <div style={{ border: "1px solid black", padding: "24px", margin: "24px" }}>
      <h1>This is React Testing Example</h1>
      {/* <input
        name="my-name"
        placeholder="enter your name"
        data-testid="name-input"
      /> */}
      <input
        name="my-name"
        placeholder="enter your name"
        custom-data-test-id="name-input"
      />
      <br />
      <br />
      <br />
      <h3>{showMe}</h3>
      <button onClick={() => setShowMe("Yeah! U clicked me")}>
        click me too
      </button>
      <br />
      <br />
      <br />
      <label htmlFor="input_1">Input 1</label>
      <input type="text" id="input_1" defaultValue="test me" />
      <br />
      <br />
      <br />
      <label htmlFor="input_2">Input 2</label>
      <input type="text" id="input_2" defaultValue="test me too" />
      <br />
      <br />
      <br />
      <button>Press me</button>
      <button>Hit me</button>
      <button>Hit me 2</button>
      <button>Hit me 3</button>
      <button>Hit me 4</button>
      <br />
      <br />
      <br />
      <div role="my-custom-div">I am here</div>
      <br />
      <br />
      <br />
      <label htmlFor="my-select">choose me:</label>
      <select id="my-select" defaultValue="1">
        <option>1</option>
        <option>2</option>
        <option>3</option>
        <option>4</option>
      </select>
      <br></br>
      <h3 custom-data-test-id="hello_input">Hello Mohit !!!</h3>
      <br></br>
      <br></br>
      <br></br>
      {!isLogin ? (
        <button
          onClick={() => {
            setIsLogin(true);
          }}
        >
          Login
        </button>
      ) : (
        <button
          onClick={() => {
            setIsLogin(false);
          }}
        >
          Logout
        </button>
      )}
      <br />
      <br />
      <br />
      <h2 id="test-my-react">Test my react</h2>
      <h2>{asyncText}</h2>
      <button
        onClick={() => {
          setTimeout(() => {
            setAsyncText("updated !!!");
          }, 2000);
        }}
      >
        Update Async Text
      </button>
      <div>
        Hi, u can test within..
        <p>i am a child !!!</p>
      </div>
      <br />
      <br />
      <MyUser
        name="mohit"
        printUser={() => {
          console.log("hi i am user !!!");
        }}
      />
    </div>
  );
}

export default ReactTesting;
