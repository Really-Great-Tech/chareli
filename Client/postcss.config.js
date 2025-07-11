import postcssPresetEnv from 'postcss-preset-env'
import postcssCustomProperties from 'postcss-custom-properties'

export default {
  plugins: [
    postcssPresetEnv({
      stage: 1,
      features: {
        'custom-properties': {
          preserve: true, // Keep CSS variables for modern browsers
        },
      },
      browsers: ['> 1%', 'last 2 versions', 'ie >= 11'],
    }),
    postcssCustomProperties({
      preserve: true, // Keep CSS variables for modern browsers
    }),
  ],
}
