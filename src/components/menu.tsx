import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingList,
  FloatingNode,
  FloatingPortal,
  FloatingTree,
  offset,
  safePolygon,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useFloatingTree,
  useHover,
  useInteractions,
  useListItem,
  useListNavigation,
  useMergeRefs,
  useRole,
  useTypeahead,
  type Placement,
} from "@floating-ui/react";
import * as React from "react";

interface MenuContextValue {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
  getItemProps: (
    userProps?: React.HTMLProps<HTMLElement>,
  ) => Record<string, unknown>;
  getFloatingProps: (
    userProps?: React.HTMLProps<HTMLElement>,
  ) => Record<string, unknown>;
  getReferenceProps: (
    userProps?: React.HTMLProps<HTMLElement>,
  ) => Record<string, unknown>;
  refs: any;
  floatingStyles: React.CSSProperties;
  context: any;
  elementsRef: React.MutableRefObject<Array<HTMLButtonElement | null>>;
  labelsRef: React.MutableRefObject<Array<string | null>>;
  isNested: boolean;
}

const MenuContext = React.createContext<MenuContextValue | null>(null);

const useMenuContext = () => {
  const context = React.useContext(MenuContext);
  if (!context) {
    throw new Error("Menu components must be wrapped in <Menu />");
  }
  return context;
};

interface UseMenuProps {
  initialOpen?: boolean;
  placement?: Placement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function useMenuLogic({
  initialOpen = false,
  placement,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: UseMenuProps = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const elementsRef = React.useRef<Array<HTMLButtonElement | null>>([]);
  const labelsRef = React.useRef<Array<string | null>>([]);

  const tree = useFloatingTree();
  const nodeId = useFloatingNodeId();
  const parentId = useFloatingParentNodeId();
  const isNested = parentId != null;

  const isOpen = controlledOpen ?? uncontrolledOpen;
  const setIsOpen = setControlledOpen ?? setUncontrolledOpen;

  const { floatingStyles, refs, context } = useFloating<HTMLButtonElement>({
    nodeId,
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: placement
      ? placement
      : isNested
        ? "right-start"
        : "bottom-start",
    middleware: [
      offset({ mainAxis: isNested ? 0 : 4, alignmentAxis: isNested ? -4 : 0 }),
      flip(),
      shift(),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    enabled: isNested,
    delay: { open: 75 },
    handleClose: safePolygon({ blockPointerEvents: true }),
  });

  const click = useClick(context, {
    event: "mousedown",
    toggle: !isNested,
    ignoreMouse: isNested,
  });

  const role = useRole(context, { role: "menu" });
  const dismiss = useDismiss(context, { bubbles: true });

  const listNavigation = useListNavigation(context, {
    listRef: elementsRef,
    activeIndex,
    nested: isNested,
    onNavigate: setActiveIndex,
    focusItemOnHover: false,
    loop: true,
  });

  const typeahead = useTypeahead(context, {
    listRef: labelsRef,
    onMatch: isOpen ? setActiveIndex : undefined,
    activeIndex,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [hover, click, role, dismiss, listNavigation, typeahead],
  );

  React.useEffect(() => {
    if (!tree) {
      return;
    }

    function handleTreeClick() {
      setIsOpen(false);
    }

    function onSubMenuOpen(event: { nodeId: string; parentId: string }) {
      if (event.nodeId !== nodeId && event.parentId === parentId) {
        setIsOpen(false);
      }
    }

    tree.events.on("click", handleTreeClick);
    tree.events.on("menuopen", onSubMenuOpen);

    return () => {
      tree.events.off("click", handleTreeClick);
      tree.events.off("menuopen", onSubMenuOpen);
    };
  }, [tree, nodeId, parentId, setIsOpen]);

  React.useEffect(() => {
    if (isOpen && tree) {
      tree.events.emit("menuopen", { parentId, nodeId });
    }
  }, [tree, isOpen, nodeId, parentId]);

  return {
    isOpen,
    setIsOpen,
    activeIndex,
    setActiveIndex,
    getItemProps,
    getFloatingProps,
    getReferenceProps,
    refs,
    floatingStyles,
    context,
    elementsRef,
    labelsRef,
    isNested,
    nodeId,
  };
}

const MenuRoot = ({
  children,
  ...props
}: React.HTMLProps<HTMLButtonElement>) => {
  const parentId = useFloatingParentNodeId();

  if (parentId === null) {
    return (
      <FloatingTree>
        <MenuNode {...props}>{children}</MenuNode>
      </FloatingTree>
    );
  }

  return <MenuNode {...props}>{children}</MenuNode>;
};

const MenuNode = ({ children }: { children: React.ReactNode }) => {
  const menu = useMenuLogic();

  return (
    <FloatingNode id={menu.nodeId}>
      <MenuContext.Provider value={menu}>{children}</MenuContext.Provider>
    </FloatingNode>
  );
};

const MenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.HTMLProps<HTMLButtonElement>
>(({ children, ...props }, forwardedRef) => {
  const menu = useMenuContext();

  return (
    <button
      ref={useMergeRefs([menu.refs.setReference, forwardedRef])}
      data-state={menu.isOpen ? "open" : "closed"}
      {...menu.getReferenceProps(props)}
    >
      {children}
    </button>
  );
});

MenuTrigger.displayName = "Menu.Trigger";

const MenuPopover = React.forwardRef<
  HTMLUListElement,
  React.HTMLProps<HTMLUListElement>
>(({ children, style, ...props }, forwardedRef) => {
  const menu = useMenuContext();

  const popoverRefs = useMergeRefs([menu.refs.setFloating, forwardedRef]);

  if (!menu.isOpen) {
    return null;
  }

  return (
    <FloatingPortal>
      <FloatingFocusManager
        context={menu.context}
        modal={false}
        initialFocus={menu.isNested ? -1 : 0}
        returnFocus={!menu.isNested}
      >
        <ul
          ref={popoverRefs}
          style={{ ...menu.floatingStyles, ...style }}
          className="Menu"
          {...menu.getFloatingProps(props)}
        >
          <FloatingList
            elementsRef={menu.elementsRef}
            labelsRef={menu.labelsRef}
          >
            {children}
          </FloatingList>
        </ul>
      </FloatingFocusManager>
    </FloatingPortal>
  );
});

MenuPopover.displayName = "Menu.Popover";

interface MenuItemProps {
  disabled?: boolean;
}

const MenuItem = React.forwardRef<
  HTMLButtonElement,
  MenuItemProps & React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, disabled, ...props }, forwardedRef) => {
  const menu = useMenuContext();
  const textLabel = typeof children === "string" ? children : null;

  const item = useListItem({ label: disabled ? null : textLabel });
  const tree = useFloatingTree();
  const isActive = item.index === menu.activeIndex;

  return (
    <li>
      <button
        {...props}
        ref={useMergeRefs([item.ref, forwardedRef])}
        type="button"
        role="menuitem"
        tabIndex={isActive ? 0 : -1}
        disabled={disabled}
        {...menu.getItemProps({
          onClick(event: React.MouseEvent<HTMLButtonElement>) {
            props.onClick?.(event);
            tree?.events.emit("click");
          },
          onFocus(event: React.FocusEvent<HTMLButtonElement>) {
            props.onFocus?.(event);
          },
        })}
      >
        {children}
      </button>
    </li>
  );
});

MenuItem.displayName = "Menu.Item";

const MenuSub = (props: React.HTMLProps<HTMLButtonElement>) => {
  return <MenuRoot {...props} />;
};

MenuSub.displayName = "Menu.Sub";

const MenuSubTrigger = React.forwardRef<
  HTMLButtonElement,
  React.HTMLProps<HTMLButtonElement>
>(({ children, ...props }, forwardedRef) => {
  const childMenu = useMenuContext();
  const item = useListItem();

  return (
    <button
      ref={useMergeRefs([childMenu.refs.setReference, item.ref, forwardedRef])}
      role="menuitem"
      data-state={childMenu.isOpen ? "open" : "closed"}
      tabIndex={-1}
      {...childMenu.getReferenceProps(props)}
      onClick={(e) => {
        props.onClick?.(e);
      }}
    >
      {children}
    </button>
  );
});

MenuSubTrigger.displayName = "Menu.SubTrigger";

export const Menu = Object.assign(MenuRoot, {
  Trigger: MenuTrigger,
  Popover: MenuPopover,
  Item: MenuItem,
  Sub: MenuSub,
  SubTrigger: MenuSubTrigger,
});
