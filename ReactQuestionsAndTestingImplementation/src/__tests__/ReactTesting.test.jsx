import {
  screen,
  render,
  fireEvent,
  configure,
  act,
  within,
  prettyDOM,
  logRoles,
} from "@testing-library/react";
import ReactTesting from "../components/ReactTesting/ReactTesting";
import getUserName from "../components/ReactTesting/User";
import userEvent from "@testing-library/user-event";
import MyUser from "../components/ReactTesting/MyUser";

// we can configure "data-testid" to "custom-data-test-id"
configure({ testIdAttribute: "custom-data-test-id" });

beforeAll(() => {
  console.log("---- BEFORE ALL -----");
});
beforeEach(() => {
  console.log("***** BEFORE EACH *****");
});

test("Snapshot Testing for this file", () => {
  // Snapshot Testing
  // A way to capture a component's output and save it, then compare it on future runs to detect unexpected changes.

  // How it works
  // 1st run  → renders component → saves output as .snap file  (baseline)
  // 2nd run+ → renders component → compares with saved snapshot
  //             match   → ✅ PASS
  //             differs → ❌ FAIL (something changed!)
  const component = render(<ReactTesting />);
  expect(component).toMatchSnapshot();
});

test("Testing ReactTesting Example file - text and input box", () => {
  console.log("----> 1 <-----");
  render(<ReactTesting />);
  const text = screen.getByText("This is React Testing Example");
  const nameBox = screen.getByTestId("name-input");
  expect(text).toBeInTheDocument();
  expect(nameBox).toBeInTheDocument();
});

describe("Grouping the test cases.", () => {
  test("Checking the name attribute is present or not", () => {
    console.log("----> 2 <-----");
    render(<ReactTesting />);
    const nameBox = screen.getByTestId("name-input");
    expect(nameBox).toHaveAttribute("name", "my-name");
  });
  test("Testing the button click and state update", () => {
    console.log("----> 3 <-----");
    render(<ReactTesting />);
    const btn = screen.getByText("click me too");
    fireEvent.click(btn);
    expect(screen.getByText("Yeah! U clicked me")).toBeInTheDocument();
  });
  test("test getUserName", () => {
    const user = "mohit";
    expect(getUserName(user)).toMatch(user);
  });
});

describe("test elements by role having same role name", () => {
  test("test semantic and non semantic element by role", () => {
    render(<ReactTesting />);
    const input_1 = screen.getByRole("textbox", { name: "Input 1" });
    expect(input_1).toBeInTheDocument();
    const input_2 = screen.getByRole("textbox", { name: "Input 2" });
    expect(input_2).toBeInTheDocument();
    const btn_1 = screen.getByRole("button", { name: "Press me" });
    expect(btn_1).toBeInTheDocument();
    const btn_2 = screen.getByRole("button", { name: "Hit me" });
    expect(btn_2).toBeInTheDocument();
    const div = screen.getByRole("my-custom-div");
    expect(div).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    for (let i = 0; i < buttons.length; i++) {
      expect(buttons[i]).toBeInTheDocument();
    }
    const options = screen.getAllByRole("option");
    for (let i = 0; i < options.length; i++) {
      expect(options[i]).toBeInTheDocument();
    }
  });
});
test("text matching test cases----->", () => {
  const { getByText } = render(<ReactTesting />);
  expect(getByText("Hello Mohit !!!").textContent).toMatch(/HIT/i); // regex
  const h3 = screen.getByText(/Mohit/);
  expect(h3).toBeInTheDocument();
});

test("testing of QueryBy----->", async () => {
  /**
   *  getBy   → finds an element that is PRESENT and VISIBLE in the DOM.
          throws an ERROR if not found.
          use when you are SURE the element EXISTS.

      queryBy → finds an element whether it is VISIBLE or HIDDEN in the DOM.
          returns NULL if not found (no error).
          use when you want to CHECK if element EXISTS or NOT.
   */

  /**
   * fireEvent vs userEvent

      Why userEvent exists
      fireEvent is low level — it just triggers a single DOM event mechanically.
      userEvent is high level — it simulates how a real user actually behaves.

      The problem with fireEvent
      When a real user types in an input, many events fire in sequence:
      focus → keydown → keypress → input → keyup → (repeat per char)
      But fireEvent.change() fires only one event — skipping the rest.

      // fireEvent — just triggers 'change' event only
      fireEvent.change(input, { target: { value: 'John' } })  
      // ❌ not realistic — no keydown, keypress, keyup fired

      // userEvent — simulates full real typing sequence
      await userEvent.type(input, 'John')
      // ✅ fires focus → keydown → keypress → input → keyup per character

   */
  const user = userEvent.setup();
  render(<ReactTesting />);
  const logout = screen.queryByText("Logout");
  expect(logout).not.toBeInTheDocument();

  const login = screen.queryByText("Login");
  expect(login).toBeInTheDocument();
  await user.click(login);

  // NOTE: don't cache RTL queries across state changes
  // Always re-query after an action. RTL queries are snapshots in time, not live references.
  // that means: don't use like below but do fresh query
  // i.e. expect(login).not.toBeInTheDocument(); as "login" is already defined above
  // Below is the reason for that::-
  // React reuses DOM nodes for same-type siblings at the same position — this is core
  // reconciliation behavior, and the reason your "cached reference" bug isn't really an RTL bug,
  // it's a React mental-model bug.

  // Fresh query !!!
  expect(screen.queryByText("Login")).not.toBeInTheDocument();
  expect(screen.queryByText("Logout")).toBeInTheDocument();
});

it("test find by....", async () => {
  /**
   * findBy* is essentially waitFor(() => getBy*()) under the hood.
   */
  const event = userEvent.setup();
  render(<ReactTesting />);
  const asyncBTN = screen.getByText("Update Async Text");
  /**
   * What act() does: Tells React — "finish all pending state updates, effects,
   * and re-renders before I assert."
   */
  /**
   * userEvent  → NO manual act() needed   ✅ , so can remove act from below code and check. Both will work.
      fireEvent  → NO manual act() needed   ✅ (RTL handles it)
      Raw timers / external updates → YES manual act() needed ⚠️
   */
  await act(async () => {
    await event.click(asyncBTN);
  });
  expect(
    await screen.findByText("updated !!!", {}, { timeout: 3000 }),
  ).toBeInTheDocument();
});

test("testing JS query selector !!!", () => {
  render(<ReactTesting />);
  const myH2 = document.querySelector("#test-my-react");
  expect(myH2).toBeInTheDocument();
});

test("testing within function !!!", () => {
  render(<ReactTesting />);
  const dv = screen.getByText("Hi, u can test within..");
  const dvChild = within(dv).getByText("i am a child !!!");
  expect(dv).toBeInTheDocument();
  expect(dvChild).toBeInTheDocument();
});

it("props testing !!!", async () => {
  const event = userEvent.setup();
  const name = "mohit";
  const testFunction = jest.fn();
  render(<MyUser name={name} printUser={testFunction} />);
  const user = screen.getByText(name);
  expect(user).toBeInTheDocument();
  const btn = screen.getByText("print user");
  await event.click(btn);
  expect(testFunction).toHaveBeenCalled();

  // Wait for the async fetch + setUserList to settle BEFORE the test ends.
  // Otherwise React fires the state update after the test scope closes → act() warning.
  expect(await screen.findByText("bison johnson")).toBeInTheDocument();
});

/**
 * React debugging in test file
 * uncomment below code to check how debugging works !!!
 */
it("React debugging in test file !!!", async () => {
  const event = userEvent.setup();
  const name = "mohit";
  const testFunction = jest.fn();
  const { container, debug } = render(
    <MyUser name={name} printUser={testFunction} />,
  );
  const user = screen.getByText(name);
  expect(user).toBeInTheDocument();
  const btn = screen.getByText("print user");
  await event.click(btn);
  expect(testFunction).toHaveBeenCalled();
  console.log(prettyDOM(container));
  debug();
  // debug(user) // debug on particular element
  /**
   * we can use "DEBUG_PRINT_LIMIT=10000 npm test" command to print 10000 lines of jsx to check the issues.
   * By default 7000 lines are printable but this will override to 10000 lines
   * we can run above command in terminal
   */
  logRoles(container);
  screen.logTestingPlaygroundURL(); // whole document
  // screen.logTestingPlaygroundURL(screen.getByRole("list")); // specific subtree
});

it("mock server testing !!!", async () => {
  const name = "mohit";
  const testFunction = jest.fn();
  render(<MyUser name={name} printUser={testFunction} />);
  const listItems = await screen.findAllByRole("listitem");
  expect(listItems).toHaveLength(2);
});

afterAll(() => {
  console.log("---- AFTER ALL -----");
});
afterEach(() => {
  console.log("***** AFTER EACH *****");
});
