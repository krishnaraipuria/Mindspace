import { colorForName, initials } from '../lib/utils'

export default function Avatar({ name, size = 32, className = '' }) {
  return (
    <span
      title={name}
      style={{ width: size, height: size, fontSize: size * 0.42, backgroundColor: colorForName(name) }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
    >
      {initials(name)}
    </span>
  )
}
