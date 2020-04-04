import jsBuild from './js/build'
import pyBuild from './py/build'

const lang = (build) => ({ build })

const py = lang(pyBuild)
const js = lang(jsBuild)

const languageMap = {
  'python': py,
  'javascript': js
}

const builderFor = languageName => languageMap[languageName].build


export default {
  builderFor
}
