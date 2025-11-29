// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  const { assetExts, sourceExts } = config.resolver;

  return {
    ...config,
    transformer: {
      ...config.transformer,
      // Use react-native-svg-transformer for SVG files
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    resolver: {
      ...config.resolver,
      // Treat .svg files as source, not assets
      assetExts: assetExts.filter((ext) => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg'],
    },
  };
})();
