import { exec } from 'child_process'



export const run = async (cmd, cwd) => {
  const executor = cb => cwd ? exec(cmd, { cwd }, cb) : exec(cmd, cb)
  return await new Promise((resolve, reject) => {
    const child = executor((err, stdout, stderr) => {
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
