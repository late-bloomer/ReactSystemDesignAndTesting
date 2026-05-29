import { useState, useEffect } from "react";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../api/userApi";

function MyUser({ name, printUser }) {
  const [userList, setUserList] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetchUsers()
      .then(setUserList)
      .catch((err) => setStatus(`load failed: ${err.message}`));
  }, []);

  const handleCreate = async () => {
    try {
      const created = await createUser({ name: "new user" });
      setUserList((prev) => [...prev, created]);
      setStatus(`created id ${created.id}`);
    } catch (err) {
      setStatus(`create failed: ${err.message}`);
    }
  };

  const handleUpdate = async () => {
    if (userList.length === 0) return;
    try {
      const first = userList[0];
      const updated = await updateUser(first.id, { name: "updated user" });
      setUserList((prev) => prev.map((u) => (u.id === first.id ? updated : u)));
      setStatus(`updated id ${updated.id}`);
    } catch (err) {
      setStatus(`update failed: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (userList.length === 0) return;
    try {
      const first = userList[0];
      await deleteUser(first.id);
      setUserList((prev) => prev.filter((u) => u.id !== first.id));
      setStatus(`deleted id ${first.id}`);
    } catch (err) {
      setStatus(`delete failed: ${err.message}`);
    }
  };

  return (
    <div>
      <h1>{name}</h1>
      <button onClick={printUser}>print user</button>
      <br />
      <br />
      <button onClick={handleCreate}>create user</button>
      <button onClick={handleUpdate}>update user</button>
      <button onClick={handleDelete}>delete user</button>
      <br />
      <br />
      {status && <p role="status">{status}</p>}
      <h3>user's list</h3>
      {userList.length > 0 && (
        <ul>
          {userList.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MyUser;
