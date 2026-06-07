import React, {useEffect} from 'react';
import {fetchUsers} from '../../api/API';
import {useAppDispatch, useAppSelector} from '../../store';
import {View, Text, Button} from 'react-native';

const Users = () => {
  const dispatch = useAppDispatch();
  const {users, loading} = useAppSelector(state => state.users);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  if (loading) {
    return (
      <View>
        <Text>{'... Loading'}</Text>
      </View>
    );
  }

  return (
    <View>
      <Button title={'Reload'} onPress={() => dispatch(fetchUsers())} />
      {users.map(user => {
        return (
          <View key={user.id}>
            <View>
              <View>
                <Text>
                  {user.first_name} {user.last_name}
                </Text>
              </View>
              <View>
                <Text>{user.email}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default Users;
