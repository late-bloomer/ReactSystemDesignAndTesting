import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import SampleImage from '../../assets/food1.svg'; // Replace with your SVG file

const ImageCard = ({config}: any) => {
  const {header, title, buttonText} = config;
  return (
    <View style={styles.card}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{header}</Text>
      </View>
      <View style={styles.imageContainer}>
        <SampleImage width={173} height={100} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity style={styles.button} activeOpacity={1} disabled={true}>
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const ThreeCard = () => {
  const cardConfig = {
    header: '03',
    title: 'Healthy Eating and Nutrition',
    buttonText: 'Learn more',
  };

  return (
    <View style={styles.container}>
      <ImageCard config={cardConfig} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    top: 50,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  card: {
    width: 207,
    height: 275,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 23,
    shadowColor: '#000',
    shadowOffset: {width: 5, height: 15},
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
    alignItems: 'center',
    marginHorizontal: 60,
    transform: [{scale: 1}], // we have three size of image. So scaling will help here bigger card has 1 and then medium one is 0.9 and small has 0.75 scale
  },
  headerContainer: {
    width: 45,
    height: 22,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 15,
    paddingVertical: 5,
    marginBottom: 15,
  },
  headerText: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  imageContainer: {
    marginBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: 500,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    height: 22,
    paddingVertical: 4,
    backgroundColor: '#000',
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ThreeCard;
