import { JSX } from 'solid-js';
import { AnyRouter } from '@tanstack/router-core';
interface TanStackRouterDevtoolsPanelCoreOptions {
    /**
     * The standard React style object used to style a component with inline styles
     */
    style?: JSX.CSSProperties;
    /**
     * The standard React class property used to style a component with classes
     */
    className?: string;
    /**
     * A boolean variable indicating whether the panel is open or closed
     */
    isOpen?: boolean;
    /**
     * A function that toggles the open and close state of the panel
     */
    setIsOpen?: (isOpen: boolean) => void;
    /**
     * Handles the opening and closing the devtools panel
     */
    handleDragStart?: (e: any) => void;
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
declare class TanStackRouterDevtoolsPanelCore {
    #private;
    constructor(config: TanStackRouterDevtoolsPanelCoreOptions);
    mount<T extends HTMLElement>(el: T): void;
    unmount(): void;
    setRouter(router: AnyRouter): void;
    setRouterState(routerState: any): void;
    setStyle(style: any): void;
    setClassName(className: any): void;
    setOptions(options: Partial<TanStackRouterDevtoolsPanelCoreOptions>): void;
}
export { TanStackRouterDevtoolsPanelCore };
