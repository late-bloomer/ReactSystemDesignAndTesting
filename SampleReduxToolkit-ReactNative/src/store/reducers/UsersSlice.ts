import {createSlice} from '@reduxjs/toolkit';
import {fetchUsers} from '../../api/API';

interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [] as UserData[],
    loading: false,
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchUsers.pending, state => {
      state.loading = true;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.users = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchUsers.rejected, state => {
      state.loading = false;
    });
  },
});

export default usersSlice.reducer;
