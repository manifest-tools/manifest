import { exec } from 'child_process'



export const run = async cmd => {
  return await new Promise((resolve, reject) => {
    const child = exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject({
          err,
          stderr
        })
        return
      }
      resolve(stdout)
    })
    child.stdout.on('data', d => console.log(d.toString()))
  })
}
