import TaskListHeader from "./ToDoListHeader.jsx";
import TaskList from "./TaskList.jsx";
import { useState, useCallback, useEffect } from "react";

export default function ToDoApp() {
  const [taskList, setTaskList] = useState(() => {
    const tList = localStorage.getItem("task-list");
    const initialList = tList ? JSON.parse(tList) : [];
    return initialList;
  });
  useEffect(() => {
    localStorage.setItem("task-list", JSON.stringify(taskList));
  }, [taskList]);
  const handleAddTask = useCallback(() => {
    setTaskList((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: "",
        placeHolder: "Add Task Name",
        description: "",
        completedStatus: false,
        createdDate: Date.now(),
        saved: false,
        subtask: [],
      },
    ]);
  }, []);
  const handleTaskItem = useCallback((event, index) => {
    const arrayIndex = index - 1;
    if (arrayIndex < 0) return; // Safety check

    setTaskList((prev) => {
      if (arrayIndex >= prev.length) return prev; // Another safety check
      const updated = [...prev];
      updated[arrayIndex] = {
        ...updated[arrayIndex],
        title: event.target.value,
      };
      return updated;
    });
  }, []);

  const handleTaskItemDescription = useCallback((event, index) => {
    setTaskList((prev) => {
      const updateList = [...prev];
      updateList[index - 1] = {
        ...updateList[index - 1],
        description: event.target.value,
      };
      return updateList;
    });
  }, []);
  const handleSubTaskItem = useCallback((event, taskIndex, subTaskIndex) => {
    setTaskList((prev) => {
      const updateList = [...prev];
      if (event.target.value !== "") {
        const subTaskList = updateList[taskIndex - 1].subtask;
        subTaskList[subTaskIndex - 1] = {
          ...subTaskList[subTaskIndex - 1],
          title: event.target.value,
        };
        updateList[taskIndex - 1] = {
          ...updateList[taskIndex - 1],
          subtask: subTaskList,
        };
      }
      return updateList;
    });
  }, []);
  const handleCRUD = useCallback((event, index, subtaskIndex = -1) => {
    const arrayIndex = index - 1;
    if (arrayIndex < 0) return;

    const type = event.target.dataset.action;
    setTaskList((prev) => {
      if (arrayIndex >= prev.length) return prev;
      const updated = [...prev];
      switch (type) {
        case "edit":
          updated[arrayIndex] = { ...updated[arrayIndex], saved: false };
          break;
        case "delete":
          return prev.filter((_, i) => i !== arrayIndex);
        case "save":
          updated[arrayIndex] = { ...updated[arrayIndex], saved: true };
          break;
        case "add-subtask": {
          let subTaskList = [...updated[arrayIndex].subtask];
          subTaskList.push({
            id: Date.now(),
            title: "",
            placeHolder: "Add SubTask Name",
            description: "",
          });
          updated[arrayIndex] = {
            ...updated[arrayIndex],
            subtask: subTaskList,
          };
          break;
        }
        case "delete-subtask": {
          const subTaskList = updated[index - 1].subtask;
          const filteredSubTask = subTaskList.filter(
            (_, i) => i !== subtaskIndex - 1
          );
          updated[index - 1] = {
            ...updated[index - 1],
            subtask: filteredSubTask,
          };
          break;
        }
        default:
          return prev;
      }
      return updated;
    });
  }, []);
  return (
    <>
      <TaskListHeader addTask={handleAddTask} />
      <TaskList
        taskList={taskList}
        onChangeTaskItem={handleTaskItem}
        handleCRUD={handleCRUD}
        onChangeTaskItemDescription={handleTaskItemDescription}
        onChangeSubTaskItem={handleSubTaskItem}
      />
    </>
  );
}
