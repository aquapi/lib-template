export interface RuntimeConfig<T extends {
  runConfig?: any
} = {}> {
  run_script: (file: string, config?: T['runConfig']) => string,
}

export const node = (): RuntimeConfig => ({
  run_script: (file) => 'node ' + file
})

export const deno = (): RuntimeConfig => ({
  run_script: (file) => 'deno -A ' + file
})

export const bun = (): RuntimeConfig => ({
  run_script: (file) => 'bun ' + file
})
