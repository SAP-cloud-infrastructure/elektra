// types/global.d.ts
declare global {
  interface Window {
    $: any
    jQuery: any
  }

  var $: any
  var jQuery: any
}

declare module "lib/policy" {
  interface Policy {
    isAllowed: (permission: string, options?: Record<string, unknown>) => boolean
  }
  export const policy: Policy
  export function setPolicy(newPolicy: Policy): void
}

export {}
