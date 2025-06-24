import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link } from '@remix-run/react'

import { DefaultErrorBoundary } from '~/components/ui/error-boundary'
import {
  badRequest,
  forbidden,
  invalid,
  notFound,
  unauthorized,
} from '~/utils/response'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const type = url.searchParams.get('type')
  switch (type) {
    case 'throw':
      throw new Error('test server error')
    case 'notfound':
      throw notFound('Page Not Found')
    case 'badrequest':
      throw badRequest('Bad Request')
    case 'notloggedin':
      throw unauthorized('Not Logged In')
    case 'forbidden':
      throw forbidden('Not Authorized')
    case 'invalid':
      throw invalid('Invalid')
  }

  return json({})
}

function Layout({ children }: { children?: React.ReactNode }) {
  const handleClick = () => {
    setTimeout(() => alert('View console for error'), 1)
    throw new Error('test client error')
  }

  return (
    <div className="m-4">
      <h1 className="mb-2 text-2xl font-bold">Test Error</h1>
      <Link className="underline decoration-dotted" to="/">
        Return Home
      </Link>
      <div className="mt-2 flex gap-2">
        <button
          className="rounded bg-red-500 px-2 py-1 text-white"
          onClick={handleClick}
        >
          Throw Client Error
        </button>
        <a
          className="rounded bg-red-500 px-2 py-1 text-white"
          href="?type=throw"
        >
          Throw Server Document Error
        </a>
        <Link
          className="rounded bg-red-500 px-2 py-1 text-white"
          to="?type=throw"
        >
          Throw Server Data Error
        </Link>
      </div>
      <div className="mt-2 flex gap-2">
        <Link
          className="rounded bg-blue-200 px-2 py-1 text-blue-900"
          to="?type=notfound"
        >
          Return Not Found Error
        </Link>
        <Link
          className="rounded bg-yellow-200 px-2 py-1  text-yellow-900"
          to="?type=badrequest"
        >
          Return Bad Request Error
        </Link>
        <Link
          className="rounded bg-purple-200 px-2 py-1 text-purple-900"
          to="?type=notloggedin"
        >
          Return Not Logged In Error
        </Link>
        <Link
          className="rounded bg-orange-200 px-2 py-1 text-orange-900"
          to="?type=forbidden"
        >
          Return Forbidden Error
        </Link>
        <Link
          className="rounded bg-yellow-200 px-2 py-1 text-yellow-900"
          to="?type=invalid"
        >
          Return Invalid Error
        </Link>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  )
}

export default function Index() {
  return <Layout></Layout>
}

export function ErrorBoundary() {
  return (
    <Layout>
      <DefaultErrorBoundary />
    </Layout>
  )
}
