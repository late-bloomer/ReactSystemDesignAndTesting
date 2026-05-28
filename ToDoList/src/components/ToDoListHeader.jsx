import "./componentStyles.css";

export default function ToDoListHeader({ addTask }) {
  return (
    <div className="header">
      <header>TASK</header>
      <button onClick={addTask}>Add Task</button>
    </div>
  );
}
