import { ComponentClass, ComponentType } from 'react';
export type Mapper<TInner, TOuter> = (input: TInner) => TOuter;
export type PredicateDiff<T> = (current: T, next: T) => boolean;
export interface InferableComponentEnhancerWithProps<TInjectedProps, TNeedsProps> {
    <P extends TInjectedProps>(component: ComponentType<P>): ComponentClass<Omit<P, keyof TInjectedProps> & TNeedsProps>;
}
export type InferableComponentEnhancer<TInjectedProps> = InferableComponentEnhancerWithProps<TInjectedProps, {}>;
export type DefaultingInferableComponentEnhancer<TInjectedProps> = InferableComponentEnhancerWithProps<TInjectedProps, Partial<TInjectedProps>>;
//# sourceMappingURL=types.d.ts.map