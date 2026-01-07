import { lazy, Suspense } from 'react';
import type { PhoneInputProps } from 'react-phone-input-2';

// Lazy load the phone input component and its styles
const PhoneInputComponent = lazy(async () => {
  // Import CSS first
  await import('react-phone-input-2/lib/style.css');
  await import('../../styles/phone-input.css');

  // Then import the component
  const module = await import('react-phone-input-2');
  return { default: module.default };
});

/**
 * Lazy-loaded PhoneInput wrapper
 * Only loads the 58KB phone-input library when this component is rendered
 * Prevents loading on home page, improving LCP by ~100ms
 */
export default function LazyPhoneInput(props: PhoneInputProps) {
  return (
    <Suspense
      fallback={
        <input
          type="tel"
          className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
          placeholder={props.placeholder || 'Phone number'}
          disabled
        />
      }
    >
      <PhoneInputComponent {...props} />
    </Suspense>
  );
}
