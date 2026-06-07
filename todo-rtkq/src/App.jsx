import { useEffect, useState } from "react";
import "./App.css";
import {
  useGetTodosQuery,
  useAddTodoMutation,
  useDeleteTodoMutation,
  useUpdateTodoMutation,
} from "./store/ApiSlice";
import { useSelector, useDispatch } from "react-redux";
import {
  setFilter,
  selectFilter,
  selectVisibleTodos,
} from "./store/FilterSlice";

// Dummy data — stands in for what we'll fetch from the API in Step 3.
// const initialTodos = [
//   { id: 1, title: "Learn Redux Toolkit", completed: true },
//   { id: 2, title: "Learn RTK Query", completed: false },
//   { id: 3, title: "Build the Todo app", completed: false },
// ];

function App() {
  const dispatch = useDispatch();
  const filter = useSelector(selectFilter);
  const {
    data: fetchTodosData = [],
    isLoading,
    isError,
    error,
  } = useGetTodosQuery();
  const [addTodo, { isLoading: isAdding }] = useAddTodoMutation();
  const [updateTodo] = useUpdateTodoMutation();
  const [deleteTodo] = useDeleteTodoMutation();
  const [text, setText] = useState(""); // controlled input value

  // const visibleTodos = fetchTodosData.filter((t) => {
  //   if (filter === "active") return !t.completed;
  //   if (filter === "completed") return t.completed;
  //   return true; // 'all'
  // });

  const visibleTodos = useSelector(selectVisibleTodos); //memoized, derived

  // ADD: prepend a new todo. Date.now() is a throwaway id for now.
  const handleAdd = async () => {
    const title = text.trim();
    if (!title) return; // ignore empty input
    const newTodo = { title, completed: false };
    try {
      // .unwrap makes errors throwable, so try catch works.
      await addTodo(newTodo).unwrap();
      setText(""); // clear the input
    } catch (err) {
      console.error("Add failed !!!", err);
    }
  };

  // TOGGLE: flip completed for the matching id, leave others untouched.
  const handleToggle = async (todoItem) => {
    console.log("todoItem", todoItem);
    try {
      await updateTodo({
        id: todoItem.id,
        completed: !todoItem.completed,
      }).unwrap();
      console.log("updated !");
    } catch (err) {
      console.err("Toggle failed !!", err);
    }
  };

  // DELETE: keep every todo except the one with this id.
  const handleDelete = async (id) => {
    try {
      await deleteTodo(id).unwrap();
    } catch (err) {
      console.err("Deletion failed: ", err);
    }
  };
  console.log("fetchTodosData", fetchTodosData);

  // Handle the two states RTK Query gives us before data is ready.
  if (isLoading) return <p className="app">Loading…</p>;
  if (isError)
    return <p className="app">Error: {error?.status ?? "failed to load"}</p>;

  return (
    <div className="app">
      <h1>Todos</h1>

      <div className="add-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="What needs doing?"
        />
        <button onClick={handleAdd}>Add</button>
      </div>
      <div className="filters">
        {["all", "active", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => dispatch(setFilter(f))}
            className={filter === f ? "active-filter" : ""}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="todo-list">
        {visibleTodos.map((todo) => (
          <li key={todo.id} className="todo-item">
            <label>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(todo)}
              />
              <span className={todo.completed ? "done" : ""}>{todo.title}</span>
            </label>
            <button className="delete" onClick={() => handleDelete(todo.id)}>
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
