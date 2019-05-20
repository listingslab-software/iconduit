const NodeCache = require('node-cache')
const {join} = require('path')

const {build} = require('./build.js')
const {createBoundTemplateReader, createTemplateReader} = require('./template.js')
const {createBrowserFactory} = require('./browser.js')
const {createFileSystem} = require('./fs.js')
const {createInputBuilderFactory} = require('./input.js')
const {createInputResolverFactory} = require('./module.js')
const {createLogger} = require('./logging.js')
const {normalize} = require('./config.js')

async function main (services) {
  const {fileSystem: {readFile, withTempDir}} = services

  const fixturePath = join(__dirname, '../test/fixture')
  const userInputDir = join(fixturePath, 'input')
  const configPath = join(userInputDir, 'iconduit.json')
  const outputPath = join(fixturePath, 'output')

  const config = normalize(JSON.parse(await readFile(configPath)))

  await withTempDir(async tempPath => {
    const options = {configPath, outputPath, tempPath, userInputDir}

    await build(services, config, options)
  })
}

const {env, exit} = process

const logger = createLogger(env)
const fileSystem = createFileSystem(env, logger)

const cache = new NodeCache()
cache.on('set', (key, value) => { logger.debug(`Setting cache key ${key} to ${JSON.stringify(value)}`) })

const services = {
  cache,
  createBrowser: createBrowserFactory(),
  createInputResolver: createInputResolverFactory(logger),
  defaultInputDir: join(__dirname, '../input'),
  fileSystem,
  logger,
  readInternalTemplate: createBoundTemplateReader(fileSystem, process, join(__dirname, '../template')),
  readTemplate: createTemplateReader(fileSystem, process),
}
services.createInputBuilder = createInputBuilderFactory(services)

main(services).catch(({stack}) => {
  logger.error(stack)
  exit(1)
})
