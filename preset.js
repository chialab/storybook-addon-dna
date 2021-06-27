function config(entry = []) {
    return [...entry, require.resolve('./lib/preset/preview')];
}

function webpackFinal(config) {
    return {
        ...config,
        module: {
            ...(config.module || {}),
            rules: [
                ...(config.module.rules || []),
                {
                    test: /\.(mj|j|t)sx?$/i,
                    loader: require.resolve('./ce-manifest-loader.js'),
                    exclude: [
                        /\/.storybook\//,
                        /\/node_modules\//,
                        /\/storybook-addon-dna\//,
                    ],
                },
            ],
        },
    };
}

module.exports = {
    webpackFinal,
    config,
};
