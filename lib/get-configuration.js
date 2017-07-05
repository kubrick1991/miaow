const path = require('path');

const { getChunkName } = require('./utils');
const { HASH_LENGTH } = require('./constants');

const getLoaders = require('./get-loaders');
const getPlugins = require('./get-plugins');

// 当前进程的路径
const processCWD = process.cwd();

// 默认选项
const DEFAULT_OPTIONS = {
  watch: false,
  context: processCWD,
  output: path.resolve(processCWD, 'build'),
  publicPath: '/',
  manifest: 'manifest',
  commons: [],
  entries: [],
  syncFiles: [],
  define: {},
  production: false,
};

// 获取 webpack 的配置信息
const getConfiguration = (_options) => {
  const options = Object.assign({}, DEFAULT_OPTIONS, _options);
  const {
    context,
    entries,
    commons,
    watch,
    output,
    publicPath,
    production,
    filename,
    define,
  } = options;

  // define 替换信息
  options.define = Object.assign({
    // CDN 变量
    __cdn__: JSON.stringify(publicPath),
    // 调试变量
    __debug__: (!production).toString(),
    // 设置 process.env.NODE_ENV 变量，可以让 vue 等库进入生产模式
    'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
  }, define);

  // 通过 entries 获取 entry
  const entry = {};
  entries.forEach((entryItem) => {
    const script = typeof entryItem === 'string' ? entryItem : entryItem.script;

    if (script) {
      entry[getChunkName(script)] = script;
    }

    if (entryItem.template) {
      entry[getChunkName(entryItem.template)] = entryItem.template;
    }
  });

  // 将 commons 里的公共组件添加到 entry 中
  commons.forEach(commonScript => (entry[getChunkName(commonScript)] = commonScript));

  const defaultFilename = production ? `[name].[chunkhash:${HASH_LENGTH}].js` : '[name].js';

  const configuration = {
    watch,
    context,
    entry,
    output: {
      path: output,
      publicPath,
      chunkFilename: defaultFilename,
      filename: filename || defaultFilename,
    },
    devtool: production ? 'nosources-source-map' : 'source-map',
    module: {
      rules: getLoaders(options),
    },
    resolve: {
      modules: ['common', 'node_modules'],
      extensions: ['.js', '.es6', '.json', '.vue', '.jsx'],
    },
    plugins: getPlugins(options),
  };

  return configuration;
};

module.exports = getConfiguration;