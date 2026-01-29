const createGlobalsSlice = (set, get) => ({
  globals: {
    embedded: false,
    urlStateKey: "",
    endpoint: null,

    actions: {
      setEmbedded: (newEmbedded) =>
        set(
          (state) => ({
          globals: { ...state.globals, embedded: newEmbedded },
          }),
          false,
          "globals/setEmbedded"
        ),
      
      setUrlStateKey: (newUrlStateKey) =>
        set(
          (state) => ({
          globals: { ...state.globals, urlStateKey: newUrlStateKey },
          }),
          false,
          "globals/setUrlStateKey"
        )
      ,
      
      setEndpoint: (newEndpoint) =>
        set(
          (state) => ({
          globals: { ...state.globals, endpoint: newEndpoint },
          }),
          false,
          "globals/setEndpoint"
        ),
       
    },
  },
})

export default createGlobalsSlice