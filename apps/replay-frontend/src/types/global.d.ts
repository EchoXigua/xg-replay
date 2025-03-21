declare global {
  namespace Common {
    interface Option<T = string | number> {
      label: string
      value: T
      [k: string]: any
    }
  }
}
export {}
