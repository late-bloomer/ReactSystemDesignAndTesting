import "./componentStyles.css";
const TaskItem = ({
  task,
  onChangeTaskItem,
  handleCRUD,
  numIndex,
  onChangeTaskItemDescription,
  onChangeSubTaskItem,
}) => {
  return (
    <div className="task-item-container">
      <h2 className="task-sr-num">{numIndex}.</h2>
      <div style={{ border: "1px solid grey", padding: "8px" }}>
        <div>
          <div className="task-item">
            {!task.saved ? (
              <input
                type="text"
                value={task.title}
                placeholder={task.placeHolder}
                onChange={(event) => onChangeTaskItem(event, numIndex)}
              />
            ) : (
              <h3 style={{ display: "inline", marginRight: "32px" }}>
                {task.title}
              </h3>
            )}
            <button
              data-action="edit"
              onClick={(event) => handleCRUD(event, numIndex)}
            >
              Edit
            </button>
            <button
              data-action="delete"
              onClick={(event) => handleCRUD(event, numIndex)}
            >
              Delete
            </button>
            <button
              data-action="save"
              onClick={(event) => handleCRUD(event, numIndex)}
            >
              Save
            </button>
            {!task.saved && (
              <button
                data-action="add-subtask"
                onClick={(event) => handleCRUD(event, numIndex)}
              >
                Add Subtask
              </button>
            )}
          </div>
          <div>
            {task.saved ? (
              <h4>{task.description}</h4>
            ) : (
              <textarea
                value={task.description}
                placeholder="Add Extra info"
                onChange={(event) =>
                  onChangeTaskItemDescription(event, numIndex)
                }
              />
            )}
          </div>
        </div>
        {task.subtask &&
          task.subtask.length > 0 &&
          task.subtask.map((stask, index) => {
            return (
              <div
                key={stask.id}
                style={{ marginTop: "8px", marginBottom: "8px" }}
              >
                <span className="task-sr-num">
                  {numIndex}.{index + 1}
                </span>
                {!task.saved ? (
                  <input
                    type="text"
                    value={stask.title}
                    placeholder={stask.placeHolder}
                    onChange={(event) =>
                      onChangeSubTaskItem(event, numIndex, index + 1)
                    }
                  />
                ) : (
                  stask.title !== "" && (
                    <h3 style={{ display: "inline", marginRight: "32px" }}>
                      {stask.title}
                    </h3>
                  )
                )}
                {!task.saved && (
                  <button
                    data-action="delete-subtask"
                    onClick={(event) => handleCRUD(event, numIndex, index + 1)}
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default TaskItem;
