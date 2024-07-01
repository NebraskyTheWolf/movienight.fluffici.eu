declare module 'react-tooltip' {
    import * as React from 'react';

    interface ReactTooltipProps {
        id?: string;
        place?: 'top' | 'right' | 'bottom' | 'left';
        type?: 'dark' | 'success' | 'warning' | 'error' | 'info' | 'light';
        effect?: 'float' | 'solid';
        className?: string;
        delayHide?: number;
        delayShow?: number;
        delayUpdate?: number;
        border?: boolean;
        getContent?: (dataTip: string) => React.ReactNode;
        afterShow?: () => void;
        afterHide?: () => void;
        overridePosition?: (
            position: { left: number; top: number },
            currentEvent: Event,
            currentTarget: EventTarget,
            node: HTMLElement,
            place: 'top' | 'right' | 'bottom' | 'left',
            desiredPlace: 'top' | 'right' | 'bottom' | 'left',
            effect: 'float' | 'solid',
            offset: { top: number; left: number }
        ) => { left: number; top: number };
    }

    class ReactTooltip extends React.Component<ReactTooltipProps> {}

    export default ReactTooltip;
}
