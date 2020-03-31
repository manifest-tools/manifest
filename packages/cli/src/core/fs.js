import * as fse from 'fs-extra'


export const listDirectories = async source => {
  const files = await fse.readdir(source, { withFileTypes: true })
  return files
    .filter(f => f.isDirectory())
    .map(dir => dir.name)
}

export const findReplaceInFile = async (filePath, pattern, replacement) => {
  const content = await fse.readFile(filePath, 'utf8')
  const newContent = content.replace(pattern, replacement)
  await fse.writeFile(filePath, newContent, 'utf8')
}
