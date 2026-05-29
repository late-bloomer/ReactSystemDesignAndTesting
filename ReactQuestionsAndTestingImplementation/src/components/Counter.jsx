/**
 * Counter — a connected Redux Toolkit component.
 *
 * Reads from store via useSelector, dispatches actions via useDispatch.
 * Used by ReduxAndContext.test.jsx to demonstrate component-level testing.
 */
import { useDispatch, useSelector } from "react-redux";
import {
  increment,
  decrement,
  addBy,
  fetchInitialCount,
  selectCount,
  selectStatus,
  selectError,
} from "../store/counterSlice";

export function Counter() {
  const dispatch = useDispatch();
  const count = useSelector(selectCount);
  const status = useSelector(selectStatus);
  const error = useSelector(selectError);

  return (
    <div>
      <h2>Count: {count}</h2>
      <p role="status">status: {status}</p>
      {error && <p role="alert">error: {error}</p>}
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
      <button onClick={() => dispatch(addBy(5))}>+5</button>
      <button onClick={() => dispatch(fetchInitialCount())}>load from API</button>
    </div>
  );
}
