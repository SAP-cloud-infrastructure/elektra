type LocalStorageSetter<T> = (value: T | ((prev: T) => T)) => void;
type LocalStorageReturnType<T> = [T, LocalStorageSetter<T>];
/**
A hook to handle local storage.

Local storage can be used like a state variable. To initialize, pass the key and a default value:

const [val, setVal] = useLocalStorage("my-val", "default value");

*/
declare function useLocalStorage<T>(key: string, initialValue: T): LocalStorageReturnType<T>;
export default useLocalStorage;
//# sourceMappingURL=useLocalStorage.d.ts.map