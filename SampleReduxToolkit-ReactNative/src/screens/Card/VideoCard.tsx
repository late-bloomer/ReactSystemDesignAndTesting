import React from 'react';
import {View, StyleSheet} from 'react-native';
import Video from 'react-native-video'; // Ensure this library is installed

const VideoCard = () => {
  return (
    <View style={styles.shadowWrapper}>
      <View style={styles.card}>
        <Video
          source={require('../../assets/video.mp4')} // Replace with your file's relative path
          style={StyleSheet.absoluteFill} // Ensures the video covers the entire card
          resizeMode="cover" // Ensures the video fills the card
          repeat // Makes the video loop
          muted={true} // Set to true if you want it muted
          playInBackground={false}
          playWhenInactive={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    // Shadow properties for iOS
    shadowColor: '#000', // Shadow color
    shadowOffset: {width: 9, height: 15}, // Shadow on bottom-right
    shadowOpacity: 0.3, // Shadow transparency
    shadowRadius: 2, // Shadow blur radius
    // Shadow properties for Android
    elevation: 10, // Android shadow (higher = larger shadow)
    backgroundColor: 'transparent', // Transparent wrapper background
    //top: 150,
    marginHorizontal: 60,
  },
  card: {
    width: 203,
    height: 393,
    backgroundColor: 'white', // Card background color
    borderRadius: 28, // Rounded corners
    overflow: 'hidden', // Clips child content inside the border radius
    flex: 1, // Ensure the card takes full size of the shadow wrapper
  },
});

export default VideoCard;
