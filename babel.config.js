// babel.config.js
module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // If you're using Expo Router (you are), keep this:
            'expo-router/babel',
            // Reanimated MUST be last:
            'react-native-reanimated/plugin',
        ],
    };
};
