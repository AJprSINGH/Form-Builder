"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ElementsType, FormElement, FormElementInstance, SubmitFunction } from "../FormElements";
import useDesigner from "../hooks/useDesigner";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

import { cn } from "@/lib/utils";
import { FaDotCircle } from "react-icons/fa";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Switch } from "../ui/switch";

const radioType: ElementsType = "RadioField";

const radioAttributes = {
  label: "Choose an option",
  options: ["Option 1", "Option 2"],
  required: false,
};

const radioSchema = z.object({
  label: z.string().min(2).max(50),
  options: z.array(z.string()).min(1),
  required: z.boolean().default(false),
});

export const RadioFieldFormElement: FormElement = {
  type: radioType,
  construct: (id: string) => ({
    id,
    type: radioType,
    extraAttributes: radioAttributes,
  }),
  designerBtnElement: {
    icon: FaDotCircle,
    label: "Radio Group",
  },
  designerComponent: ({ elementInstance }) => {
    const { label, options, required } = (elementInstance.extraAttributes as typeof radioAttributes) ?? { options: [] as string[] };
    return (
    <div className="flex flex-col gap-2 w-full">
      <Label>{label}{required && "*"}</Label>
      {options.map((opt: string, idx: number) => (
        <label key={idx}>
        <input type="radio" disabled /> {opt}
        </label>
      ))}
    </div>
    );
  },
  formComponent: ({ elementInstance, submitValue, isInvalid, defaultValue }) => {
    const { label, options, required } = (elementInstance.extraAttributes as typeof radioAttributes) ?? { options: [] as string[] };
    const [error, setError] = useState(false);

    useEffect(() => {
      setError(isInvalid === true);
    }, [isInvalid]);

    return (
      <div className="flex flex-col gap-2 w-full">
        <Label className={cn(error && "text-red-500")}>
          {label} {required && "*"}
        </Label>
        {options.map((opt: string, idx: number) => (
          <label key={idx}>
            <input
              type="radio"
              name={elementInstance.id}
              value={opt}
              defaultChecked={defaultValue === opt}
              onChange={(e) => {
                const valid = RadioFieldFormElement.validate(elementInstance, e.target.value);
                setError(!valid);
                if (valid && submitValue) submitValue(elementInstance.id, e.target.value);
              }}
            />{" "}
            {opt}
          </label>
        ))}
      </div>
    );
  },
  propertiesComponent: ({ elementInstance }) => {
    type CustomInstance = FormElementInstance & { extraAttributes: typeof radioAttributes };
    const element = elementInstance as CustomInstance;
    const { updateElement } = useDesigner();

    const form = useForm<z.infer<typeof radioSchema>>({
      resolver: zodResolver(radioSchema),
      defaultValues: element.extraAttributes,
    });

    useEffect(() => {
      form.reset(element.extraAttributes);
    }, [element]);

    const applyChanges = form.handleSubmit((values) => {
      updateElement(element.id, {
        ...element,
        extraAttributes: values,
      });
    });

    return (
      <Form {...form}>
        <form onBlur={applyChanges} onSubmit={(e) => e.preventDefault()} className="space-y-3">
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="options"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Options (comma separated)</FormLabel>
                <FormControl>
                  <Input
                    value={field.value.join(", ")}
                    onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()))}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="required"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-3 shadow-sm border rounded">
                <div>
                  <FormLabel>Required</FormLabel>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  },
  validate: (elementInstance, value) => {
    if (elementInstance.extraAttributes?.required) {
      return value?.length > 0;
    }
    return true;
  },
};
