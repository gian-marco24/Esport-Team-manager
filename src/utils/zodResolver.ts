import type { ZodSchema } from 'zod';
import type { FieldValues, FieldErrors, FieldError } from 'react-hook-form';

export const customZodResolver = <T extends FieldValues>(schema: ZodSchema<T>) => {
  return async (values: T) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const errors: FieldErrors<T> = {};
    for (const issue of result.error.issues) {
      const path = issue.path[0] as keyof T;
      if (path && !errors[path]) {
        errors[path] = {
          type: issue.code,
          message: issue.message,
        } as FieldError as FieldErrors<T>[keyof T];
      }
    }

    return { values: {}, errors };
  };
};
