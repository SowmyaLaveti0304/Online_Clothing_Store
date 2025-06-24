import { InputDescription, InputLabel } from '@mantine/core'

import { cn } from '~/utils/misc'

export const DetailField = ({
  label,
  value,
  orientation = 'horizontal',
}: {
  label: React.ReactNode
  orientation?: 'horizontal' | 'vertical'
  value: React.ReactNode | null
}) => (
  <div
    className={cn(
      orientation === 'vertical'
        ? 'flex flex-col gap-1'
        : 'flex items-center justify-between',
    )}
  >
    <InputLabel>{label}</InputLabel>
    <InputDescription className="text-xsm">{value}</InputDescription>
  </div>
)
