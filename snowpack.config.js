// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  plugins: ['@snowpack/plugin-sass'],
  mount: {
    public: { url: '/', static: true },
    src: { url: '/dist' },
  },
};
