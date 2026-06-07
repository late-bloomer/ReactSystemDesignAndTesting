import {createAsyncThunk} from '@reduxjs/toolkit';
interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  const response = await fetch('https://reqres.in/api/users?delay=1');
  return (await response.json()).data as UserData[];
});
