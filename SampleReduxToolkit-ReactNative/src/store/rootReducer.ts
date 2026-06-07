import {combineReducers} from '@reduxjs/toolkit';
import messageReducer from './reducers/MessageSlice';
import usersReducer from './reducers/UsersSlice';

const rootReducer = combineReducers({
  message: messageReducer,
  users: usersReducer,
});

export default rootReducer;
