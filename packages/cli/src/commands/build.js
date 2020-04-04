import * as fse from 'fs-extra'
import * as _ from 'lodash'

import * as core from '~manifest/core'
import languages from '~manifest/languages'


const build = async ({
  manifesto
}) => {

  const { language } = manifesto

  const builder = languages.builderFor(language)

  await builder({
    manifesto
  })

}

export default build
