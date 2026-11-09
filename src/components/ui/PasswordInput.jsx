import { useState } from 'react'

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12S6.2 6.5 12 6.5 21.5 12 21.5 12 17.8 17.5 12 17.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.5 4.5 20.5 19.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M9.5 6.9A9.6 9.6 0 0 1 12 6.5c5.8 0 9.5 5.5 9.5 5.5a16.6 16.6 0 0 1-3.2 3.6M6.2 8.2C4.1 9.7 2.5 12 2.5 12S6.2 17.5 12 17.5c1.1 0 2.1-.2 3-.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.1 10.3a2.6 2.6 0 0 0 3.6 3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function PasswordInput(props) {
  const [visible, setVisible] = useState(false)

  return (
    <span className="password-field">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-toggle"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </span>
  )
}
