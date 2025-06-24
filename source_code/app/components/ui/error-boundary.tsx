import { type ErrorResponse } from '@remix-run/node'
import { Link, isRouteErrorResponse, useRouteError } from '@remix-run/react'
import {
  CircleAlertIcon,
  MinusCircleIcon,
  SearchIcon,
  ShieldAlertIcon,
  TriangleAlertIcon,
} from 'lucide-react'

export function DefaultErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return <CatchBoundary caught={error} />
  }

  const { message, stack } = error as Error

  return (
    <>
      <div className="m-2 rounded bg-red-100 p-4">
        <h1 className="mb-1 inline-flex items-center gap-4 text-2xl font-bold text-red-900">
          <CircleAlertIcon className="size-8" name="exclamation-circle" />
          {message || 'App Error'}
        </h1>
        <p className="mb-1 text-lg">
          An error has occurred processing your request. You may try again or
          contact support if the problem persists.
        </p>
      </div>
      {stack && (
        <div className="my-4 w-[95%] bg-white p-4 text-black">
          <pre className="max-w-full overflow-auto ">{stack}</pre>
          <p className="mt-4 italic text-red-500">
            Stack trace only displayed in DEVELOPMENT
          </p>
        </div>
      )}
    </>
  )
}

function CatchBoundary({ caught }: { caught: ErrorResponse }) {
  let message: string
  let data: any = {}

  if (typeof caught.data === 'string') {
    message = caught.data
  } else {
    data = caught.data
    message = data.message
  }

  switch (caught.status) {
    case 400:
      return <BadRequest data={data} message={message} />
    case 401:
      return <Unauthorized data={data} message={message} />
    case 403:
      return <Forbidden data={data} message={message} />
    case 404:
      return <NotFound data={data} message={message} />
    case 405:
      return <Invalid data={data} message={message} />
    default:
      throw new Error(
        `Unexpected caught response with status: ${caught.status} ${caught.data}}`,
      )
  }
}

function Unauthorized({ message }: { data: any; message: string }) {
  return (
    <div className="m-2 rounded bg-purple-100 p-4">
      <h1 className="mb-1 inline-flex items-center gap-2 text-2xl font-bold text-purple-900">
        <MinusCircleIcon className="size-8" name="minus-circle" />
        {message || 'Unauthorized'}
      </h1>
      <p className="mb-1 text-lg">
        You must be logged into access this page. Click{' '}
        <Link to="/login">here</Link> to login.
      </p>
    </div>
  )
}

function BadRequest({
  message,
  data,
}: {
  data?: { errors: string[] }
  message: string
}) {
  return (
    <div className="m-2 rounded bg-yellow-100 p-4">
      <h1 className="mb-1 inline-flex items-center gap-2 text-2xl font-bold text-red-900">
        <TriangleAlertIcon className="size-8" />
        {message || 'Bad Request'}
      </h1>
      <p className="mb-1 text-lg">
        You made an invalid request. The following errors have occurred.
      </p>
      {data?.errors && (
        <ul className="ml-4 list-disc">
          {data.errors.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Invalid({ message }: { data: any; message: string }) {
  return (
    <div className="m-2 rounded bg-yellow-100 p-4">
      <h1 className="mb-1 inline-flex items-center gap-2 text-2xl font-bold text-red-900">
        <TriangleAlertIcon className="size-8" />
        {message || 'Invalid'}
      </h1>
      <p className="mb-1 text-lg">You made an invalid request.</p>
    </div>
  )
}

function Forbidden({ message }: { data: any; message: string }) {
  return (
    <div className="m-2 rounded bg-orange-100 p-4">
      <h1 className="mb-1 inline-flex items-center gap-2 text-2xl font-bold text-orange-900">
        <ShieldAlertIcon className="size-8" name="shield-exclamation" />
        {message || 'Not Authorized'}
      </h1>
      <p className="mb-1 text-lg">
        You are not authorized to access this page.
      </p>
    </div>
  )
}

function NotFound({ message }: { data: any; message: string }) {
  return (
    <div className="m-2 rounded bg-blue-100 p-4">
      <h1 className="mb-1 inline-flex items-center gap-2 text-2xl font-bold text-blue-900">
        <SearchIcon className="size-8" name="magnifying-glass" />
        {message || 'Not Found'}
      </h1>
      <p className="mb-1 text-lg">
        The page you were looking for could not be found.
      </p>
    </div>
  )
}
