// types/global.d.ts
declare global {
  interface Window {
    $: any
    jQuery: any
  }

  var $: any
  var jQuery: any
}

export {}
