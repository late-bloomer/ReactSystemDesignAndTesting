import { createRef } from "react";
import { render } from "@testing-library/react";
import ClassComponent from "../components/ReactTesting/ClassComponentTesting";

test("getUserList returns the input array", () => {
  const ref = createRef();
  render(<ClassComponent ref={ref} />);
  const data = ["mohit", "sharma"];
  expect(ref.current.getUserList(data)).toEqual(data);
});
