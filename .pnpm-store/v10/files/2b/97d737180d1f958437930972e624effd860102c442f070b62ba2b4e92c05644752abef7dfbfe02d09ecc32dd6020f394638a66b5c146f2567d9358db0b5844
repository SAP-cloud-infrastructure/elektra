import { AnyRouter } from '@tanstack/router-core';
interface DevtoolsOptions {
    /**
     * Set this true if you want the dev tools to default to being open
     */
    initialIsOpen?: boolean;
    /**
     * Use this to add props to the panel. For example, you can add class, style (merge and override default style), etc.
     */
    panelProps?: any & {
        ref?: any;
    };
    /**
     * Use this to add props to the close button. For example, you can add class, style (merge and override default style), onClick (extend default handler), etc.
     */
    closeButtonProps?: any & {
        ref?: any;
    };
    /**
     * Use this to add props to the toggle button. For example, you can add class, style (merge and override default style), onClick (extend default handler), etc.
     */
    toggleButtonProps?: any & {
        ref?: any;
    };
    /**
     * The position of the TanStack Router logo to open and close the devtools panel.
     * Defaults to 'bottom-left'.
     */
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    /**
     * Use this to render the devtools inside a different type of container element for a11y purposes.
     * Any string which corresponds to a valid intrinsic JSX element is allowed.
     * Defaults to 'footer'.
     */
    containerElement?: string | any;
    /**
     * A boolean variable indicating if the "lite" version of the library is being used
     */
    router: AnyRouter;
    routerState: any;
    /**
     * Use this to attach the devtool's styles to specific element in the DOM.
     */
    shadowDOMTarget?: ShadowRoot;
}
declare class TanStackRouterDevtoolsCore {
    #private;
    constructor(config: DevtoolsOptions);
    mount<T extends HTMLElement>(el: T): void;
    unmount(): void;
    setRouter(router: AnyRouter): void;
    setRouterState(routerState: any): void;
    setOptions(options: Partial<DevtoolsOptions>): void;
}
export { TanStackRouterDevtoolsCore };
