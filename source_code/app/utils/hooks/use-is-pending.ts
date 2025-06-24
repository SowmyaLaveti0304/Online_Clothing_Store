import { useFormAction, useNavigation } from '@remix-run/react'

/**
 * Interface for options provided to the useIsPending hook.
 */
interface UseIsPendingOptions {
  /**
   * Form action URL. If not provided, the hook will use the current route's form action url.
   */
  formAction?: string

  /**
   * HTTP method used for form submission. Default is 'POST'.
   */
  formMethod?: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'

  /**
   * State of form submission. Default is 'non-idle', which returns true when submission state is not idle.
   */
  state?: 'loading' | 'non-idle' | 'submitting'
}

/**
 * @link - https://github.com/epicweb-dev/epic-stack/blob/04aececc5d3137713f9f01d132f3a25a122aff78/app/utils/misc.tsx#L147
 *
 * Custom hook that checks if a specific form is currently submitting and matches the input parameters.
 *
 * NOTE: The default formAction includes query params, while the navigation.formAction does not.
 * If you're interested in checking if a form is submitting without specific query params, don't use the default formAction.
 *
 */
export function useIsPending({
  formAction,
  formMethod = 'POST',
  state = 'non-idle',
}: UseIsPendingOptions = {}): boolean {
  const contextualFormAction = useFormAction()
  const navigation = useNavigation()

  const isPendingState =
    state === 'non-idle'
      ? navigation.state !== 'idle'
      : navigation.state === state

  return (
    isPendingState &&
    navigation.formAction === (formAction ?? contextualFormAction) &&
    navigation.formMethod === formMethod
  )
}
