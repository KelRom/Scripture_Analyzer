module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'], // ✅ remove 'expo-router/babel'
    };
};
