interface CanceledError {
  isCanceled: true
}

interface CancelablePromise<T> {
  promise: Promise<T>
  cancel(): void
}

export default function makeCancelable<T>(promise: Promise<T>): CancelablePromise<T> {
  let hasCanceled_ = false

  const wrappedPromise = new Promise<T>((resolve, reject) => {
    promise.then(
      (val: T) => (hasCanceled_ ? reject({ isCanceled: true } as CanceledError) : resolve(val)),
      (error: any) => (hasCanceled_ ? reject({ isCanceled: true } as CanceledError) : reject(error))
    )
  })

  return {
    promise: wrappedPromise,
    cancel(): void {
      hasCanceled_ = true
    },
  }
}
