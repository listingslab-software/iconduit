const standardDeviceDefinitions = require('./definition/device.js')
const standardDisplayDefinitions = require('./definition/display.js')
const standardInputDefinitions = require('./definition/input.js')
const standardOutputDefinitions = require('./definition/output.js')
const standardSizeDefinitions = require('./definition/size.js')
const standardStyleDefinitions = require('./definition/style.js')
const standardTargetDefinitions = require('./definition/target.js')

const {
  BROWSER_TARGET_DEFAULTS,
  INPUT_STRATEGY_COMPOSITE,
  INPUT_STRATEGY_DEGRADE,
  INSTALLER_DMG,
  OS_IOS,
  OS_MACOS,
  OS_WINDOWS,
  WEB_FACEBOOK,
  WEB_REDDIT,
  WEB_TWITTER,
} = require('./constant.js')

const {
  all: standardAllTargetDefinition,
  browser: standardBrowserTargetDefinitions,
  installer: standardInstallerTargetDefinitions,
  os: standardOsTargetDefinitions,
  web: standardWebTargetDefinitions,
} = standardTargetDefinitions

module.exports = {
  normalize,
  resolveColors,
}

function normalize (config) {
  assertObject(config, 'config')

  const {
    categories = [],
    colors = {},
    definitions = {},
    description = null,
    displayMode = 'standalone',
    iarcRatingId = null,
    inputs = {},
    language = null,
    name,
    orientation = null,
    outputs = {},
    preferRelatedApplications = null,
    scope = null,
    shortName = null,
    startUrl = null,
    targets = {},
    textDirection = 'auto',
  } = config

  assertArrayOfNonEmptyStrings(categories, 'categories')
  assertOptionalNonEmptyString(description, 'description')
  assertNonEmptyString(displayMode, 'displayMode')
  assertOptionalNonEmptyString(iarcRatingId, 'iarcRatingId')
  assertOptionalNonEmptyString(language, 'language')
  assertNonEmptyString(name, 'name')
  assertOptionalNonEmptyString(orientation, 'orientation')
  assertOptionalBoolean(preferRelatedApplications, 'preferRelatedApplications')
  assertOptionalNonEmptyString(scope, 'scope')
  assertOptionalNonEmptyString(shortName, 'shortName')
  assertOptionalNonEmptyString(startUrl, 'startUrl')
  assertNonEmptyString(textDirection, 'textDirection')

  return {
    categories: normalizeCategories(categories),
    colors: normalizeColors(colors),
    definitions: normalizeDefinitions(definitions),
    description,
    displayMode,
    iarcRatingId,
    inputs: normalizeInputs(inputs),
    language,
    name,
    orientation,
    outputs: normalizeOutputs(outputs),
    preferRelatedApplications,
    scope,
    shortName,
    startUrl,
    targets: normalizeTargets(targets),
    textDirection,
  }
}

function resolveColors (config) {
  const {colors, definitions: {color}} = config

  const resolved = {}

  for (const colorType in colors) {
    const name = colors[colorType]
    const definition = color[name]

    resolved[colorType] = definition || name
  }

  return resolved
}

function normalizeCategories (categories) {
  return Array
    .from(
      new Set(
        categories.map(category => category.toLowerCase())
      )
    )
    .sort()
}

function normalizeColors (colors) {
  assertObject(colors, 'colors')

  const {background, foreground} = colors

  assertNonEmptyString(background, 'colors.background')
  assertNonEmptyString(foreground, 'colors.foreground')

  const {
    mask = foreground,
    theme = background,
    tile = background,
  } = colors

  assertNonEmptyString(mask, 'colors.mask')
  assertNonEmptyString(theme, 'colors.theme')
  assertNonEmptyString(tile, 'colors.tile')

  return {
    background,
    foreground,
    mask,
    theme,
    tile,
  }
}

function normalizeDefinitions (definitions) {
  assertObject(definitions, 'definitions')

  const {
    color: userColorDefinitions = {},
    device: userDeviceDefinitions = {},
    display: userDisplayDefinitions = {},
    input: userInputDefinitions = {},
    output: userOutputDefinitions = {},
    size: userSizeDefinitions = {},
    style: userStyleDefinitions = {},
    target: userTargetDefinitions = {},
  } = definitions

  assertObjectOfNonEmptyStrings(userColorDefinitions, 'definitions.color')

  const color = userColorDefinitions
  const device = {...standardDeviceDefinitions, ...userDeviceDefinitions}
  const display = {...standardDisplayDefinitions, ...userDisplayDefinitions}
  const input = normalizeInputDefinitions(userInputDefinitions)
  const output = normalizeOutputDefinitions(userOutputDefinitions)
  const size = normalizeSizeDefinitions(device, display, userSizeDefinitions)
  const style = {...standardStyleDefinitions, ...userStyleDefinitions}
  const target = normalizeTargetDefinitions(userTargetDefinitions)

  return {
    color,
    device,
    display,
    input,
    output,
    size,
    style,
    target,
  }
}

function normalizeInputDefinitions (input) {
  assertObject(input, 'definitions.input')

  const normalized = {...standardInputDefinitions}

  for (const inputName in input) {
    const definition = input[inputName]
    const inputSetting = `definitions.input.${inputName}`

    const {
      strategy,
      options = {},
    } = definition

    normalized[inputName] = {
      strategy,
      options: normalizeInputDefinitionOptions(strategy, options, inputSetting),
    }
  }

  return normalized
}

function normalizeInputDefinitionOptions (strategy, options, inputSetting) {
  const optionsSetting = `${inputSetting}.options`

  assertObject(options, optionsSetting)

  switch (strategy) {
    case INPUT_STRATEGY_COMPOSITE: return normalizeCompositeInputDefinitionOptions(options, optionsSetting)
    case INPUT_STRATEGY_DEGRADE: return normalizeDegradeInputDefinitionOptions(options, optionsSetting)
  }

  throw new Error(`Invalid value for ${inputSetting}.strategy`)
}

function normalizeCompositeInputDefinitionOptions (options, optionsSetting) {
  const {
    backgroundColor = 'transparent',
    layers,
    mask = null,
  } = options

  assertOptionalNonEmptyString(mask, `${optionsSetting}.mask`)

  return {
    backgroundColor,
    layers: normalizeCompositeInputDefinitionLayers(layers, `${optionsSetting}.layers`),
    mask,
  }
}

function normalizeCompositeInputDefinitionLayers (layers, layersSetting) {
  assertNonEmptyArray(layers, layersSetting)

  const normalized = []

  for (let index = 0; index < layers.length; ++index) {
    const layerSetting = `${layersSetting}[${index}]`

    const {
      input,
      multiplier = 1,
      style = null,
    } = layers[index]

    assertNonEmptyString(input, `${layerSetting}.input`)
    assertInteger(multiplier, `${layerSetting}.multiplier`)
    assertOptionalNonEmptyString(style, `${layerSetting}.style`)

    normalized[index] = {
      input,
      multiplier,
      style,
    }
  }

  return normalized
}

function normalizeDegradeInputDefinitionOptions (options, optionsSetting) {
  const {
    to,
  } = options

  assertNonEmptyString(to, `${optionsSetting}.to`)

  return {
    to,
  }
}

function normalizeOutputDefinitions (output) {
  assertObject(output, 'definitions.output')

  const normalized = {...standardOutputDefinitions}

  for (const outputName in output) {
    const definition = output[outputName]
    const outputSetting = `definitions.output.${outputName}`

    assertObject(definition, outputSetting)

    const {
      input,
      name,
      options = {},
      sizes = [],
    } = definition

    assertNonEmptyString(input, `${outputSetting}.input`)
    assertNonEmptyString(name, `${outputSetting}.name`)
    assertArrayOfNonEmptyStrings(sizes, `${outputSetting}.sizes`)

    normalized[outputName] = {
      input,
      name,
      options: normalizeOutputDefinitionOptions(options, outputSetting),
      sizes,
    }
  }

  return normalized
}

function normalizeOutputDefinitionOptions (options, outputSetting) {
  const optionsSetting = `${outputSetting}.options`

  assertObject(options, optionsSetting)

  const {
    variables = {},
  } = options

  assertObject(variables, `${optionsSetting}.variables`)

  return {
    variables,
  }
}

function normalizeSizeDefinitions (device, display, size) {
  assertObject(size, 'definitions.size')

  const displaySizes = {}
  const deviceSizes = {}
  const userSizes = {}

  for (const displayName in display) {
    const {resolution: {horizontal, vertical}, pixelDensity, pixelRatio, orientation} = display[displayName]
    const orientationSize = {width: horizontal, height: vertical, pixelDensity, pixelRatio}
    const rotatedSize = {width: vertical, height: horizontal, pixelDensity, pixelRatio}
    const portraitSize = `display.${displayName}.portrait`
    const landscapeSize = `display.${displayName}.landscape`

    if (orientation === 'portrait') {
      displaySizes[portraitSize] = orientationSize
      displaySizes[landscapeSize] = rotatedSize
    } else if (orientation === 'landscape') {
      displaySizes[portraitSize] = rotatedSize
      displaySizes[landscapeSize] = orientationSize
    } else {
      throw new Error(`Invalid value for definitions.display.${displayName}.orientation`)
    }
  }

  for (const deviceName in device) {
    const {display: displayName} = device[deviceName]

    if (!display[displayName]) {
      throw new Error(`Missing definition for display.${displayName} in definitions.device.${displayName}.display`)
    }

    deviceSizes[`device.${deviceName}.portrait`] = displaySizes[`display.${displayName}.portrait`]
    deviceSizes[`device.${deviceName}.landscape`] = displaySizes[`display.${displayName}.landscape`]
  }

  for (const name in size) {
    const userSize = size[name]
    const sizeSetting = `definitions.size.${name}`

    assertObject(userSize, sizeSetting)

    const {
      width,
      height,
      pixelDensity = 72,
      pixelRatio = 1,
    } = size[name]

    assertInteger(width, `${sizeSetting}.width`)
    assertInteger(height, `${sizeSetting}.height`)
    assertInteger(pixelDensity, `${sizeSetting}.pixelDensity`)
    assertInteger(pixelRatio, `${sizeSetting}.pixelRatio`)

    userSizes[name] = {
      width,
      height,
      pixelDensity,
      pixelRatio,
    }
  }

  return {...displaySizes, ...deviceSizes, ...standardSizeDefinitions, ...userSizes}
}

function normalizeTargetDefinitions (target) {
  assertObject(target, 'definitions.target')

  const {
    all = standardAllTargetDefinition,
    browser = {},
    installer = {},
    os = {},
    web = {},
  } = target

  return {
    all: normalizeTargetDefinition(all, 'definitions.target.all'),
    browser: normalizeTargetDefinitionCategory(
      standardBrowserTargetDefinitions,
      browser,
      'definitions.target.browser'
    ),
    installer: normalizeTargetDefinitionCategory(
      standardInstallerTargetDefinitions,
      installer,
      'definitions.target.installer'
    ),
    os: normalizeTargetDefinitionCategory(
      standardOsTargetDefinitions,
      os,
      'definitions.target.os'
    ),
    web: normalizeTargetDefinitionCategory(
      standardWebTargetDefinitions,
      web,
      'definitions.target.web'
    ),
  }
}

function normalizeTargetDefinitionCategory (standardDefinitions, definitions, setting) {
  assertObject(definitions, setting)

  const normalized = {}

  for (const name in definitions) {
    normalized[name] = normalizeTargetDefinition(definitions[name], `${setting}.${name}`)
  }

  return {...standardDefinitions, ...normalized}
}

function normalizeTargetDefinition (definition, setting) {
  assertObject(definition, setting)

  const {
    outputs = [],
  } = definition

  assertArrayOfNonEmptyStrings(outputs, `${setting}.outputs`)

  return {
    outputs,
  }
}

function normalizeInputs (inputs) {
  assertObjectOfNonEmptyStrings(inputs, 'inputs')

  return inputs
}

function normalizeOutputs (outputs) {
  const {
    include = [],
    exclude = [],
  } = outputs

  return {
    include,
    exclude,
  }
}

function normalizeTargets (targets) {
  assertObject(targets, 'targets')

  const {
    browser = [BROWSER_TARGET_DEFAULTS],
    installer = [INSTALLER_DMG],
    os = [OS_IOS, OS_MACOS, OS_WINDOWS],
    web = [WEB_FACEBOOK, WEB_REDDIT, WEB_TWITTER],
  } = targets

  assertArrayOfNonEmptyStrings(browser, 'targets.browser')
  assertArrayOfNonEmptyStrings(installer, 'targets.installer')
  assertArrayOfNonEmptyStrings(os, 'targets.os')
  assertArrayOfNonEmptyStrings(web, 'targets.web')

  return {
    browser,
    installer,
    os,
    web,
  }
}

function assertExists (value, setting) {
  if (value === null || typeof value === 'undefined') throw new Error(`Missing value for ${setting}`)
}

function assertNonEmptyString (value, setting) {
  assertExists(value, setting)
  if (typeof value !== 'string') throw new Error(`Invalid value for ${setting}`)
}

function assertOptionalNonEmptyString (value, setting) {
  if (value === null) return
  if (typeof value !== 'string') throw new Error(`Invalid value for ${setting}`)
}

function assertInteger (value, setting) {
  assertExists(value, setting)
  if (!Number.isInteger(value)) throw new Error(`Invalid value for ${setting}`)
}

function assertOptionalBoolean (value, setting) {
  if (value === null) return
  if (value !== true && value !== false) throw new Error(`Invalid value for ${setting}`)
}

function assertArray (value, setting) {
  assertExists(value, setting)
  if (!Array.isArray(value)) throw new Error(`Invalid value for ${setting}`)
}

function assertNonEmptyArray (value, setting) {
  assertArray(value, setting)
  if (value.length < 1) throw new Error(`Invalid value for ${setting}`)
}

function assertArrayOfNonEmptyStrings (value, setting) {
  assertArray(value, setting)

  for (let index = 0; index < value.length; ++index) {
    if (typeof value[index] !== 'string') throw new Error(`Invalid value for ${setting}[${index}]`)
  }
}

function assertObject (value, setting) {
  assertExists(value, setting)
  if (typeof value !== 'object') throw new Error(`Invalid value for ${setting}`)
}

function assertObjectOfNonEmptyStrings (value, setting) {
  assertObject(value, setting)

  for (const key in value) {
    if (typeof value[key] !== 'string') throw new Error(`Invalid value for ${setting}.${key}`)
  }
}
