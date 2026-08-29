import { validate, ValidationError } from "class-validator";

const validateCrudPayload = async (
  entity: object,
  extraErrors: ValidationError[] = [],
  options?: { property: string },
): Promise<void> => {
  const entityErrors: ValidationError[] = await validate(entity, {
    forbidUnknownValues: false,
  });

  const allErrors = [...entityErrors, ...extraErrors];

  if (allErrors.length) {
    const errors: TValidationError["validation"] = allErrors.map((e) => ({
      property: options?.property || e.property,
      messages: e.constraints ? Object.values(e.constraints) : [],
    }));
    throw BadValidation(errors);
  }
};
export default validateCrudPayload;
