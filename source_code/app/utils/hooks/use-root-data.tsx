import { type SerializeFrom } from '@remix-run/node'
import { useRouteLoaderData } from '@remix-run/react'
import { type loader } from '~/root'

export function useRootData() {
  return useRouteLoaderData('root') as SerializeFrom<typeof loader>
}
