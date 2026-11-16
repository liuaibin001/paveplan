import { Tabs as Primitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

export function Tabs({ className, ...props }: Primitive.Root.Props) {
  return (
    <Primitive.Root
      data-slot="tabs"
      className={cn("ui-tabs", className)}
      {...props}
    />
  );
}
export function TabsList({ className, ...props }: Primitive.List.Props) {
  return (
    <Primitive.List
      data-slot="tabs-list"
      className={cn("ui-tabs-list", className)}
      {...props}
    />
  );
}
export function TabsTrigger({ className, ...props }: Primitive.Tab.Props) {
  return (
    <Primitive.Tab
      data-slot="tabs-trigger"
      className={cn("ui-tab", className)}
      {...props}
    />
  );
}
export function TabsContent({ className, ...props }: Primitive.Panel.Props) {
  return (
    <Primitive.Panel
      data-slot="tabs-content"
      className={cn("ui-tab-content", className)}
      {...props}
    />
  );
}
