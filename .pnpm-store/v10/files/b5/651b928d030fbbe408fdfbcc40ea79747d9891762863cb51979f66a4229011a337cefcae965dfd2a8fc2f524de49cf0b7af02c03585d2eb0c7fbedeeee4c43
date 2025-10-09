import { createSignal, createEffect } from "solid-js";
const getItem = (key) => {
  try {
    const itemValue = localStorage.getItem(key);
    if (typeof itemValue === "string") {
      return JSON.parse(itemValue);
    }
    return void 0;
  } catch {
    return void 0;
  }
};
function useLocalStorage(key, defaultValue) {
  const [value, setValue] = createSignal();
  createEffect(() => {
    const initialValue = getItem(key);
    if (typeof initialValue === "undefined" || initialValue === null) {
      setValue(
        typeof defaultValue === "function" ? defaultValue() : defaultValue
      );
    } else {
      setValue(initialValue);
    }
  });
  const setter = (updater) => {
    setValue((old) => {
      let newVal = updater;
      if (typeof updater == "function") {
        newVal = updater(old);
      }
      try {
        localStorage.setItem(key, JSON.stringify(newVal));
      } catch {
      }
      return newVal;
    });
  };
  return [value, setter];
}
export {
  useLocalStorage as default
};
//# sourceMappingURL=useLocalStorage.js.map
