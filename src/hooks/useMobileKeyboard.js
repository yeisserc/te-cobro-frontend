import { useEffect } from 'react'

const KEYBOARD_THRESHOLD_PX = 80
const FOCUS_SCROLL_DELAY_MS = 320
const SCROLL_PADDING_PX = 16

function isFormField(element) {
  return element instanceof HTMLElement && element.matches('input, textarea, select')
}

function getScrollParent(element) {
  return element.closest('.app-shell, .auth-shell')
}

function getFormAnchor(field) {
  const form = field.closest('form')
  if (!form) return field
  return (
    form.querySelector('.actions-row') ||
    form.querySelector('button[type="submit"], .btn-primary') ||
    field
  )
}

function ensureFormActionsVisible(field) {
  const scroller = getScrollParent(field)
  if (!scroller) return

  const anchor = getFormAnchor(field)
  const scrollerRect = scroller.getBoundingClientRect()
  const fieldRect = field.getBoundingClientRect()
  const anchorRect = anchor.getBoundingClientRect()

  const topOverflow = scrollerRect.top + SCROLL_PADDING_PX - fieldRect.top
  if (topOverflow > 0) {
    scroller.scrollTop -= topOverflow
  }

  const bottomOverflow = anchorRect.bottom - (scrollerRect.bottom - SCROLL_PADDING_PX)
  if (bottomOverflow > 0) {
    scroller.scrollTop += bottomOverflow
  }
}

export function useMobileKeyboard() {
  useEffect(() => {
    const root = document.documentElement
    const vv = window.visualViewport
    let focusTimer = 0

    const syncViewport = () => {
      const viewportHeight = vv?.height ?? window.innerHeight
      const offsetTop = vv?.offsetTop ?? 0
      const inset = Math.max(0, window.innerHeight - viewportHeight - offsetTop)

      root.style.setProperty('--app-height', `${viewportHeight}px`)
      root.style.setProperty('--keyboard-inset', `${inset}px`)
      root.classList.toggle('keyboard-open', inset > KEYBOARD_THRESHOLD_PX)
    }

    const onFocusIn = (event) => {
      const field = event.target
      if (!isFormField(field)) return

      window.clearTimeout(focusTimer)
      focusTimer = window.setTimeout(() => {
        syncViewport()
        ensureFormActionsVisible(field)
      }, FOCUS_SCROLL_DELAY_MS)
    }

    syncViewport()
    vv?.addEventListener('resize', syncViewport)
    vv?.addEventListener('scroll', syncViewport)
    window.addEventListener('resize', syncViewport)
    document.addEventListener('focusin', onFocusIn)

    return () => {
      window.clearTimeout(focusTimer)
      vv?.removeEventListener('resize', syncViewport)
      vv?.removeEventListener('scroll', syncViewport)
      window.removeEventListener('resize', syncViewport)
      document.removeEventListener('focusin', onFocusIn)
      root.style.removeProperty('--app-height')
      root.style.removeProperty('--keyboard-inset')
      root.classList.remove('keyboard-open')
    }
  }, [])
}
