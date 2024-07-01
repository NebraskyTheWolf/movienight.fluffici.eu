declare module 'react-contextify' {
    import * as React from 'react';

    interface MenuProps {
        id: string;
        children?: React.ReactNode;
    }

    interface ItemProps {
        onClick: (args: { event: React.MouseEvent; props: any; triggerEvent: React.MouseEvent }) => void;
        children?: React.ReactNode;
    }

    interface UseContextMenuProps {
        id: string;
    }

    export const Menu: React.FC<MenuProps>;
    export const Item: React.FC<ItemProps>;
    export const useContextMenu: (props: UseContextMenuProps) => { show: (event: React.MouseEvent, p: {
            props: { messageId: string }
        }) => void };
}
