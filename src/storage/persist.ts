export function persistStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) {
    return Promise.resolve(false)
  }
  return navigator.storage.persist()
}
