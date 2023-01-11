module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          extensions: ['.tsx', '.ts', '.js', '.json'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
