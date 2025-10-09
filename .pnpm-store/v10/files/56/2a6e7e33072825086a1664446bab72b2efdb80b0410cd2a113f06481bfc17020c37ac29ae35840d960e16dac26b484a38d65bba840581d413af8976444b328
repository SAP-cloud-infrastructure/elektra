import { ButtonHTMLAttributes, HTMLAttributes, default as React } from 'react';
import { AnyRouter } from '@tanstack/react-router';
interface DevtoolsOptions {
    /**
     * Set this true if you want the dev tools to default to being open
     */
    initialIsOpen?: boolean;
    /**
     * Use this to add props to the panel. For example, you can add className, style (merge and override default style), etc.
     */
    panelProps?: HTMLAttributes<HTMLDivElement>;
    /**
     * Use this to add props to the close button. For example, you can add className, style (merge and override default style), onClick (extend default handler), etc.
     */
    closeButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
    /**
     * Use this to add props to the toggle button. For example, you can add className, style (merge and override default style), onClick (extend default handler), etc.
     */
    toggleButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
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
     * The router instance to use for the devtools.
     */
    router?: AnyRouter;
    /**
     * Use this to attach the devtool's styles to specific element in the DOM.
     */
    shadowDOMTarget?: ShadowRoot;
}
export declare function TanStackRouterDevtools(props: DevtoolsOptions): React.ReactElement | null;
export {};
