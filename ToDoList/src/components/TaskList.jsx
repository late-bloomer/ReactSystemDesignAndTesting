import TaskItem from "./TaskItem.jsx";
const TaskList = ({
  taskList,
  onChangeTaskItem,
  handleCRUD,
  onChangeTaskItemDescription,
  onChangeSubTaskItem,
}) => {
  return (
    <div className="task-list">
      <h2 className="task-list-header">Task list</h2>
      {taskList.map((item, index) => {
        return (
          <TaskItem
            key={item.id}
            task={item}
            onChangeTaskItem={onChangeTaskItem}
            handleCRUD={handleCRUD}
            numIndex={index + 1}
            onChangeTaskItemDescription={onChangeTaskItemDescription}
            onChangeSubTaskItem={onChangeSubTaskItem}
          />
        );
      })}
    </div>
  );
};

export default TaskList;
