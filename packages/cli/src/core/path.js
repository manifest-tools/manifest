



export const dirName = path => path.split('/').slice(-1)[0]

export const removeOverlap = (longPath, shortPath) => {
  // longPath =>  `./.manifest/build/${service}/platform/services/${service}/service.proto`
  // shortPath => `./.manifest/build/${service}`
  return longPath.replace(shortPath, '')
}
