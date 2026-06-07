const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = async () => {
  const defaultConfig = await getDefaultConfig(__dirname); // Get default config
  const {
    resolver: {assetExts, sourceExts},
  } = defaultConfig;

  return mergeConfig(defaultConfig, {
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'), // SVG support
    },
    resolver: {
      assetExts: assetExts.filter(ext => ext !== 'svg'), // Remove svg from asset extensions
      sourceExts: [...sourceExts, 'svg', 'mp4'], // Add svg and mp4 to source extensions
      extraNodeModules: {
        buffer: require.resolve('buffer'),
      },
    },
  });
};

module.exports = config();
