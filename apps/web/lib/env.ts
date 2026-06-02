function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`[env] Missing required var: ${name}`)
  return v
}

export const env = {
  postgres: {
    get url() {
      return required('POSTGRES_URL')
    },
  },
}
