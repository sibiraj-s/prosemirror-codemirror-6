// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
export default {
  plugins: ['@snowpack/plugin-sass'],
  mount: {
    public: { url: '/', static: true },
    src: { url: '/dist' },
  },
  buildOptions: {
    baseUrl: '/prosemirror-codemirror-6/',
    clean: true,
  },
};
