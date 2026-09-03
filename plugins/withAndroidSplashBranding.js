const {AndroidConfig, withAndroidStyles, withDangerousMod} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const DEFAULT_IMAGE = './assets/splash-branding-android.png';
const DRAWABLE_DENSITY_DIR = 'drawable-xxhdpi';
const DRAWABLE_NAME = 'splashscreen_branding';
const SPLASH_STYLE_GROUP = {name: 'Theme.App.SplashScreen', parent: 'Theme.SplashScreen'};

const withBrandingDrawable = (config, image) =>
  withDangerousMod(config, [
    'android',
    async config => {
      const source = path.resolve(config.modRequest.projectRoot, image);
      if (!fs.existsSync(source)) {
        throw new Error(`withAndroidSplashBranding: branding image not found at ${source}`);
      }
      const destination = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res', DRAWABLE_DENSITY_DIR);
      await fs.promises.mkdir(destination, {recursive: true});
      await fs.promises.copyFile(source, path.join(destination, `${DRAWABLE_NAME}.png`));
      return config;
    },
  ]);

const withBrandingStyle = config =>
  withAndroidStyles(config, config => {
    config.modResults = AndroidConfig.Styles.assignStylesValue(config.modResults, {
      add: true,
      value: `@drawable/${DRAWABLE_NAME}`,
      name: 'android:windowSplashScreenBrandingImage',
      parent: SPLASH_STYLE_GROUP,
    });
    return config;
  });

module.exports = (config, props) => {
  const image = (props && props.image) || DEFAULT_IMAGE;
  return withBrandingStyle(withBrandingDrawable(config, image));
};
