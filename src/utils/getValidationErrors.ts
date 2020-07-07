import { ValidationError } from 'yup';

interface Errors {
  [key: string]: string;
}

export default function getValidationErrors(err: ValidationError): Errors {
  const validationErrors = err.inner.reduce(
    (a, c) => ({
      ...a,
      [c.path]: c.message,
    }),
    {},
  );
  return validationErrors;
}
