/**
 * Reusable form components for Bloom application
 * 
 * These components provide consistent styling and behavior
 * for form fields across the application, reducing code duplication
 * and improving maintainability.
 * 
 * @example
 * ```tsx
 * <FormSection title="Personal Information" icon={<UserIcon />}>
 *   <TextInput
 *     id="firstName"
 *     label="First Name"
 *     value={formData.firstName}
 *     onChange={(val) => setFormData({ ...formData, firstName: val })}
 *     required
 *     placeholder="Enter your first name"
 *   />
 * </FormSection>
 * ```
 */

export { FormField, TextInput, TextAreaInput, FormSection } from './FormComponents';
