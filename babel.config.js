function transformImportMetaEnv({ types: t }) {
  return {
    name: 'transform-import-meta-env-for-metro',
    visitor: {
      MemberExpression(path) {
        const object = path.node.object;
        const property = path.node.property;
        if (
          t.isMetaProperty(object) &&
          object.meta.name === 'import' &&
          object.property.name === 'meta' &&
          t.isIdentifier(property, { name: 'env' })
        ) {
          path.replaceWith(t.memberExpression(t.identifier('process'), t.identifier('env')));
        }
      },
    },
  };
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [transformImportMetaEnv, 'react-native-reanimated/plugin'],
  };
};
