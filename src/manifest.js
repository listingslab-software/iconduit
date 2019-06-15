const htmlTag = require('html-tag')

const {getType} = require('./mime.js')
const {renderSize, resolveSize} = require('./size.js')
const {resolveColors} = require('./config/resolution.js')
const {resolveUrl} = require('./url.js')

module.exports = {
  buildManifest,
  buildTags,
}

function buildManifest (config, outputs) {
  const meta = {...config}
  delete meta.colors
  delete meta.definitions
  delete meta.inputs
  delete meta.outputs
  delete meta.tags
  delete meta.targets

  return {
    ...meta,

    color: resolveColors(config),
    output: buildManifestOutput(config, outputs),
  }
}

function buildTags (manifest, tags, outputs) {
  const {output: manifestOutput} = manifest
  const tag = {}

  function add (tags, resolveTag, setting) {
    for (const tagName in tags) {
      const setDefinition = tags[tagName]

      for (const sectionName in setDefinition) {
        const tagDefinitions = setDefinition[sectionName]
        const sectionTags = tag[sectionName] || []

        for (let index = 0; index < tagDefinitions.length; ++index) {
          const definition = tagDefinitions[index]
          const resolvedTag = resolveTag(definition, `${setting}.${tagName}.${sectionName}[${index}]`)

          if (resolvedTag) sectionTags.push(resolvedTag)
        }

        tag[sectionName] = sectionTags
      }
    }
  }

  add(tags, createTagResolver({manifest}), 'definitions.tag')

  for (const outputName in outputs) {
    const {sizes, tags} = outputs[outputName]
    const output = manifestOutput[outputName]
    const setting = `definitions.output.${outputName}.tags`

    if (sizes.length > 0) {
      for (const key in output) {
        const outputSize = output[key]

        add(tags, createTagResolver({manifest, output: outputSize}), setting)
      }
    } else {
      add(tags, createTagResolver({manifest, output}), setting)
    }
  }

  for (const sectionName in tag) {
    tag[sectionName].sort((a, b) => {
      const {sortWeight: weightA} = a
      const {sortWeight: weightB} = b

      return weightA - weightB
    })
  }

  return tag
}

function buildManifestOutput (config, outputs) {
  const {definitions: {size: sizeDefinitions}, urls: {output: outputBaseUrl}} = config
  const output = {}

  for (const outputName in outputs) {
    const {name: template, sizes} = outputs[outputName]

    if (sizes.length > 0) {
      output[outputName] = {}

      for (const selector of sizes) {
        const {key, ...size} = resolveSize(sizeDefinitions, selector)
        const htmlSizes = renderSize('[dimensions]', size)
        const filename = renderSize(template, size)
        const type = getType(filename)
        const url = resolveUrl(outputBaseUrl, filename)

        output[outputName][key] = {htmlSizes, size, type, url}
      }
    } else {
      const type = getType(template)
      const url = resolveUrl(outputBaseUrl, template)

      output[outputName] = {type, url}
    }
  }

  return output
}

function createTagResolver (definitions) {
  function resolve (value) {
    return typeof value === 'function' ? value(definitions) : value
  }

  return function resolveTag (definition) {
    const {
      attributes,
      children,
      isSelfClosing,
      predicate,
      sortWeight,
      tag,
    } = definition

    for (const value of predicate) {
      let resolvedValue

      try {
        resolvedValue = resolve(value)
      } catch (error) {}

      if (!resolvedValue) return null
    }

    const resolvedAttributes = {}

    for (const name in attributes) {
      const value = resolve(attributes[name])

      resolvedAttributes[name] = typeof value === 'number' ? value.toString() : value
    }

    const resolvedChildren = children.map(resolveTag)
    const innerHtml = resolvedChildren.map(({html}) => html).join('')
    const html = htmlTag(tag, resolvedAttributes, innerHtml)

    return {
      tag,
      attributes: resolvedAttributes,
      children: resolvedChildren,
      html,
      isSelfClosing,
      sortWeight,
    }
  }
}
