import * as _ from 'lodash'


export const toPascalCase = str => _.upperFirst(_.camelCase(str))
export const toSnakeCase = str => _.snakeCase(str)

export const anyToSnakeCase = thing => {

  const converter = (value) => {

    if (!value) return () => value

    const isObject = typeof value === 'object' && value !== null
    const isArray = value.constructor === Array

    if (isArray) return () => value.map(v => anyToSnakeCase(v))
    if (isObject) return () => Object.keys(value).reduce((acc, key) => ({ ...acc, [toSnakeCase(key)]: anyToSnakeCase(value[key]) }), {})
    return () => value

  }

  return converter(thing)()

}
