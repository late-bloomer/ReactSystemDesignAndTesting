import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Hills from '../../assets/hills.svg'; // Replace with your SVG file
import Journey from '../../assets/journey.svg'; // Replace with your SVG file
import Arrow from '../../assets/Arrow_outward.svg'; // Replace with your SVG file
import Timeline from '../../assets/timeline.svg'; // Replace with your SVG file
import Bars from '../../assets/bars.svg'; // Replace with your SVG file
import Settings from '../../assets/settings.svg'; // Replace with your SVG file

const ImageCard = ({config}: any) => {
  const {header, scenario, transform = 1} = config;

  return (
    <View style={[styles.card, {transform: [{scale: transform}]}]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {scenario.type === 'view' ? (
            <Hills width={28} height={28} />
          ) : (
            <Timeline width={28} height={28} />
          )}
          <Text style={styles.headerText}>{header.text}</Text>
        </View>
        <Arrow width={35} height={35} />
      </View>

      {/* Image */}
      <View style={styles.imageContainer}>
        {scenario.type === 'view' ? (
          <Journey width="100%" height={150} />
        ) : (
          <Bars width="100%" height={150} />
        )}
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {scenario.type === 'view' ? (
          <TouchableOpacity
            style={[
              styles.viewContainer,
              {backgroundColor: scenario.viewContent.backgroundColor},
            ]}>
            <Settings width={28} height={28} />
            <Text style={styles.viewText}>{scenario.viewContent.text}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.statsContainer}>
            {scenario.statsContent.stats.map((item: any, index: any) => (
              <View key={index} style={styles.statsItem}>
                <Text style={styles.statsValue}>{item.value}</Text>
                <Text style={styles.statsUnit}>{item.unit}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const TwoCard = () => {
  const config = [
    {
      header: {
        //leftIcon: require('./assets/left-icon.svg'),
        text: 'This month',
        //rightIcon: require('./assets/right-icon.svg'),
      },
      image: '', //require('./assets/example-image.svg'),
      transform: 0.75,
      scenario: {
        type: 'stats', // 'view' or 'stats'
        statsContent: {
          stats: [
            {value: '35', unit: 'min'},
            {value: '2', unit: 'modules'},
            {value: '1', unit: 'session'},
          ],
        },
      },
    },
    {
      header: {
        //leftIcon: './assets/left-icon.svg',
        text: 'Your Journey',
        //rightIcon: './assets/right-icon.svg',
      },
      image: '', //'./assets/example-image.svg',
      scenario: {
        type: 'view',
        viewContent: {
          //leftIcon: './assets/view-left-icon.svg',
          text: 'Great Job! Keep it up',
          backgroundColor: '#FFD29D',
        },
      },
    },
  ];

  return (
    <View style={styles.container}>
      {config.map((item: any, index: any) => (
        <ImageCard config={item} key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    top: 150,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  card: {
    width: 278,
    height: 212,
    backgroundColor: '#FFF',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: {width: 12, height: 20},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    padding: 16,
    marginHorizontal: 60,
    marginBottom: 36,
    justifyContent: 'space-between',
    //transform: [{scale: 1}],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    //alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 34,
  },
  viewText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  statsItem: {
    alignItems: 'baseline',
    flexDirection: 'row',
    marginRight: 8,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 4,
  },
  statsUnit: {
    fontSize: 12,
  },
});

export default TwoCard;
