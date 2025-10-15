import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
  orientation: "horizontal" | "vertical";
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      className,
      defaultValue,
      value: valueProp,
      onValueChange,
      orientation = "horizontal",
      children,
      ...props
    },
    ref
  ) => {
    const baseId = React.useId();
    const isControlled = valueProp !== undefined;
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const value = isControlled ? valueProp : internalValue;
    const localRef = React.useRef<HTMLDivElement | null>(null);
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        localRef.current = node;

        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref]
    );

    React.useEffect(() => {
      if (!isControlled) {
        setInternalValue(defaultValue);
      }
    }, [defaultValue, isControlled]);

    const handleValueChange = React.useCallback(
      (next: string) => {
        if (!isControlled) {
          setInternalValue(next);
        }
        if (value !== next) {
          onValueChange?.(next);
        }
      },
      [isControlled, onValueChange, value]
    );

    const contextValue = React.useMemo(
      () => ({ value, setValue: handleValueChange, baseId, orientation }),
      [value, handleValueChange, baseId, orientation]
    );

    React.useEffect(() => {
      const root = localRef.current;
      if (!root) {
        return;
      }

      const triggers = Array.from(
        root.querySelectorAll<HTMLButtonElement>(
          "[data-tabs-trigger][data-tabs-managed='dom']"
        )
      );

      if (triggers.length === 0) {
        return;
      }

      const handleClick = (event: Event) => {
        const target = event.currentTarget as HTMLButtonElement | null;
        if (!target) {
          return;
        }

        const triggerValue = target.getAttribute("data-value");
        if (!triggerValue) {
          return;
        }

        handleValueChange(triggerValue);
      };

      triggers.forEach((trigger) => {
        trigger.addEventListener("click", handleClick);
      });

      return () => {
        triggers.forEach((trigger) => {
          trigger.removeEventListener("click", handleClick);
        });
      };
    }, [handleValueChange]);

    React.useEffect(() => {
      const root = localRef.current;
      if (!root) {
        return;
      }

      const triggers = Array.from(
        root.querySelectorAll<HTMLButtonElement>("[data-tabs-trigger]")
      );
      const panels = Array.from(
        root.querySelectorAll<HTMLElement>("[data-tabs-content]")
      );

      triggers.forEach((trigger) => {
        const triggerValue = trigger.getAttribute("data-value");
        if (!triggerValue) {
          return;
        }

        if (!trigger.id) {
          trigger.id = `${baseId}-trigger-${triggerValue}`;
        }
        trigger.setAttribute("aria-controls", `${baseId}-content-${triggerValue}`);

        const isActive = triggerValue === value;
        trigger.setAttribute("data-state", isActive ? "active" : "inactive");
        trigger.setAttribute("aria-selected", isActive ? "true" : "false");
        trigger.tabIndex = isActive ? 0 : -1;
      });

      panels.forEach((panel) => {
        const panelValue = panel.getAttribute("data-value");
        if (!panelValue) {
          return;
        }

        if (!panel.id) {
          panel.id = `${baseId}-content-${panelValue}`;
        }
        panel.setAttribute("aria-labelledby", `${baseId}-trigger-${panelValue}`);

        const isActive = panelValue === value;
        panel.setAttribute("data-state", isActive ? "active" : "inactive");
        panel.setAttribute("aria-hidden", isActive ? "false" : "true");
        panel.toggleAttribute("hidden", !isActive);
        panel.tabIndex = 0;
      });
    }, [baseId, value]);

    return (
      <TabsContext.Provider value={contextValue}>
        <div
          ref={setRefs}
          className={cn("w-full", className)}
          data-orientation={orientation}
          data-tabs-root
          {...props}
        >
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        "relative inline-flex h-10 items-center rounded-full border bg-muted/60 p-1 text-muted-foreground shadow-inner",
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = "TabsList";

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);

    if (!context) {
      return (
        <button
          ref={ref}
          type="button"
          role="tab"
          data-value={value}
          data-tabs-trigger=""
          data-tabs-managed="dom"
          aria-selected={false}
          className={cn(
            "inline-flex min-w-[88px] items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=inactive]:opacity-70",
            className
          )}
          {...props}
        />
      );
    }

    const { value: activeValue, setValue, baseId } = context;
    const isActive = activeValue === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={`${baseId}-trigger-${value}`}
        data-value={value}
        data-tabs-trigger=""
        data-tabs-managed="react"
        data-state={isActive ? "active" : "inactive"}
        aria-selected={isActive}
        aria-controls={`${baseId}-content-${value}`}
        onClick={() => setValue(value)}
        className={cn(
          "inline-flex min-w-[88px] items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=inactive]:opacity-70 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs",
          className
        )}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);

    if (!context) {
      return (
        <div
          ref={ref}
          role="tabpanel"
          tabIndex={0}
          data-value={value}
          data-tabs-content=""
          data-tabs-managed="dom"
          className={cn("mt-6 focus-visible:outline-hidden", className)}
          {...props}
        />
      );
    }

    const { value: activeValue, baseId } = context;
    const isActive = activeValue === value;

    return (
      <div
        ref={ref}
        role="tabpanel"
        tabIndex={0}
        hidden={!isActive}
        data-state={isActive ? "active" : "inactive"}
        id={`${baseId}-content-${value}`}
        aria-labelledby={`${baseId}-trigger-${value}`}
        data-value={value}
        data-tabs-content=""
        data-tabs-managed="react"
        className={cn("mt-6 focus-visible:outline-hidden", className)}
        {...props}
      />
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
