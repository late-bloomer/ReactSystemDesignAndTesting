import React from "react";

export default class ClassComponent extends React.Component {
  getUserList(a = []) {
    return a;
  }
  render() {
    return (
      <div
        style={{ border: "1px solid black", padding: "24px", margin: "24px" }}
      >
        <h2>Class Component Testing !!!</h2>
        <h4>Users List</h4>
      </div>
    );
  }
}
