const { when, whenProd } = require('@craco/craco')
const CracoLessPlugin = require('craco-less')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WebpackBar = require('webpackbar')
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const TerserPlugin = require('terser-webpack-plugin')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const GitReversionPlugin = require('git-revision-webpack-plugin')
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin')

const resolve = (dir) => require('path').join(__dirname, dir)

const gitRevisionPlugin = new GitReversionPlugin()

const isBuildAnalyzer = process.env.BUILD_ANALYZER === 'true'

module.exports = {
  reactScriptsVersion: 'react-scripts',
  style: {},
  devServer: {
    overlay: {
      warnings: false,
      errors: false,
    },
    port: 3030,
  },
  babel: {
    plugins: [
      [
        'import',
        {
          libraryName: 'antd',
          libraryDirectory: 'es',
          style: true,
        },
        'antd',
      ],
    ],
  },
  webpack: {
    alias: {
      '@': resolve('src'),
    },
    plugins: [
      // dayjs
      new AntdDayjsWebpackPlugin(),
      // 编译产物分析
      ...when(
        isBuildAnalyzer,
        () => [
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          }),
        ],
        []
      ),
      ...whenProd(
        () => [
          // webpack 构建进度条
          new WebpackBar(),
          // 去 console
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: true,
              },
            },
          }),
          // gzip 压缩
          new CompressionWebpackPlugin({
            filename: '[path][base].gz',
            algorithm: 'gzip',
            test: new RegExp('\\.(' + ['js', 'css'].join('|') + ')$'),
            threshold: 10240,
            minRatio: 0.8,
          }),
          // brotli 压缩
          new CompressionWebpackPlugin({
            filename: '[path][base].br',
            algorithm: 'brotliCompress',
            test: /\.(js|css|html|svg)$/,
            threshold: 10240,
            minRatio: 0.8,
          }),
        ],
        []
      ),
    ],
    configure: (webpackConfig, { env, paths }) => {
      webpackConfig.plugins.map((plugin) => {
        if (plugin instanceof HtmlWebpackPlugin) {
          plugin.options.git = {
            branch: gitRevisionPlugin.branch(),
            version: gitRevisionPlugin.version(),
            commitHash: gitRevisionPlugin.commithash(),
          }
        }
      })
      return webpackConfig
    },
  },
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            javascriptEnabled: true,
            modifyVars: {
              // 主题变量 https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less
              // '@primary-color': '#2671b4',
            },
          },
        },
      },
    },
  ],
}
