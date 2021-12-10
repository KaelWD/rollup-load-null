let context
let promise
let resolve
const blockingModules = new Set()

async function awaitResolve (id) {
  if (id) {
    blockingModules.add(id)
  }

  if (!promise) {
    promise = new Promise((_resolve) => resolve = _resolve)

    awaitBlocking()
    await promise
    blockingModules.clear()

    console.log('ready')
    promise = null
  }
}

async function awaitBlocking () {
  let pending
  do {
    pending = await Promise.any([
      promise,
      getPendingModules().then(v => {
        console.log('pendingModules', v)
        return !!v.length
      })
    ])
  } while (pending)

  resolve()
}

async function getPendingModules () {
  // #######################
  // Add this line to fix it
  // #######################
  // await new Promise(resolve => setTimeout(resolve, 0))

  return (await Promise.all(
    Array.from(context.getModuleIds())
      .filter(id => !blockingModules.has(id)) // Ignore the current file
      .map(id => context.getModuleInfo(id))
      .filter(module => module.code == null) // Ignore already loaded modules
      .map(module => context.load(module))
  )).filter(module => module.code == null)
}

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/main.js',
    format: 'es'
  },
  plugins: [{
    buildStart () {
      context = this
    },
    async transform (code, id) {
      if (id.endsWith('styles.js')) {
        console.log('transform', id)
        await awaitResolve(id)
      }
    },
  }]
}
