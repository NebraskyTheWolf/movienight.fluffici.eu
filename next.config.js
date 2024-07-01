const { PHASE_PRODUCTION_BUILD } = require('next/constants');
const withPlugins = require('next-compose-plugins');
const TerserPlugin = require('terser-webpack-plugin');
const compression = require('compression');

const customCompression = () => (req, res, next) => {
    compression({
        threshold: 0,
        brotli: true,
    })(req, res, next);
};

const nextConfig = {
    experimental: {
        missingSuspenseWithCSRBailout: false,
    },
    reactStrictMode: true,
    distDir: 'build',
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.optimization.minimizer = [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: true,
                        },
                    },
                }),
            ];
        }

        return config;
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Server',
                        value: 'FurRaidDB',
                    },
                ],
            },
        ];
    },
};

module.exports = withPlugins(
    [[customCompression, { phase: PHASE_PRODUCTION_BUILD }]],
    nextConfig
);
