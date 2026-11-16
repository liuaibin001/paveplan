import { Accordion as Primitive } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion(props: Primitive.Root.Props) {
  return <Primitive.Root data-slot="accordion" {...props} />;
}
export function AccordionItem({ className, ...props }: Primitive.Item.Props) {
  return <Primitive.Item className={cn("faq-item", className)} {...props} />;
}
export function AccordionTrigger({
  children,
  className,
  ...props
}: Primitive.Trigger.Props) {
  return (
    <Primitive.Header>
      <Primitive.Trigger className={cn("faq-trigger", className)} {...props}>
        {children}
        <ChevronDown size={18} />
      </Primitive.Trigger>
    </Primitive.Header>
  );
}
export function AccordionContent({
  children,
  ...props
}: Primitive.Panel.Props) {
  return (
    <Primitive.Panel keepMounted className="faq-content" {...props}>
      <div>{children}</div>
    </Primitive.Panel>
  );
}
