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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Switch } from "../ui/switch";
import { MdAccessTime } from "react-icons/md";

const timeType: ElementsType = "TimeField";

const timeAttributes = {
  label: "Pick Time",
  required: false,
};

const timeSchema = z.object({
  label: z.string().min(2).max(50),
  required: z.boolean().default(false),
});

export const TimeFieldFormElement: FormElement = {
  type: timeType,
  construct: (id: string) => ({
    id,
    type: timeType,
    extraAttributes: timeAttributes,
  }),
  designerBtnElement: {
    icon: MdAccessTime,
    label: "Time Picker",
  },
  designerComponent: ({ elementInstance }) => {
    const { label, required } = elementInstance.extraAttributes as typeof timeAttributes;
    return (
      <div className="flex flex-col gap-2 w-full">
        <Label>{label}{required && "*"}</Label>
        <Input readOnly disabled type="time" />
      </div>
    );
  },
  formComponent: ({ elementInstance, submitValue, isInvalid, defaultValue }) => {
    const { label, required } = elementInstance.extraAttributes ?? {};
    const [error, setError] = useState(false);

    useEffect(() => {
      setError(isInvalid === true);
    }, [isInvalid]);

    return (
      <div className="flex flex-col gap-2 w-full">
        <Label className={cn(error && "text-red-500")}>
          {label} {required && "*"}
        </Label>
        <Input
          type="time"
          defaultValue={defaultValue}
          className={cn(error && "border-red-500")}
          onChange={(e) => {
            const value = e.target.value;
            const valid = TimeFieldFormElement.validate(elementInstance, value);
            setError(!valid);
            if (valid && submitValue) submitValue(elementInstance.id, value);
          }}
        />
      </div>
    );
  },
  propertiesComponent: ({ elementInstance }) => {
    type CustomInstance = FormElementInstance & { extraAttributes: typeof timeAttributes };
    const element = elementInstance as CustomInstance;
    const { updateElement } = useDesigner();

    const form = useForm<z.infer<typeof timeSchema>>({
      resolver: zodResolver(timeSchema),
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
            name="required"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-3 shadow-sm border rounded">
                <div><FormLabel>Required</FormLabel></div>
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
