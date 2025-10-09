import { default as React } from 'react';
export interface ClientOnlyProps {
    /**
     * The children to render when the JS is loaded.
     */
    children: React.ReactNode;
    /**
     * The fallback component to render if the JS is not yet loaded.
     */
    fallback?: React.ReactNode;
}
/**
 * Render the children only after the JS has loaded client-side. Use an optional
 * fallback component if the JS is not yet loaded.
 *
 * @example
 * Render a Chart component if JS loads, renders a simple FakeChart
 * component server-side or if there is no JS. The FakeChart can have only the
 * UI without the behavior or be a loading spinner or skeleton.
 *
 * ```tsx
 * return (
 *   <ClientOnly fallback={<FakeChart />}>
 *     <Chart />
 *   </ClientOnly>
 * )
 * ```
 */
export declare function ClientOnly({ children, fallback }: ClientOnlyProps): import("react/jsx-runtime").JSX.Element;
