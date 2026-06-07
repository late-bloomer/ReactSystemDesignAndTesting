import React from 'react';
import {SafeAreaView, ScrollView, View, StyleSheet} from 'react-native';
import {Provider} from 'react-redux';
import {store} from './src/store/store';
import Message from './src/screens/message/Message';
//import Users from './src/screens/users/Users';
// import VideoCard from './src/screens/Card/VideoCard';
// import ThreeCard from './src/screens/Card/ThreeCard';
// import {Text} from 'react-native-svg';
//import TwoCard from './src/screens/Card/TwoCard';

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <View>
            <Message />
            {/* <Users /> */}
            {/* <VideoCard />
            <ThreeCard /> */}
            {/* <TwoCard /> */}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // Centers the card vertically
    alignItems: 'center', // Centers the card horizontally
    backgroundColor: '#EDD4F7', // Background color
  },
});

export default App;
