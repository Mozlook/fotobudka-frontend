import { Toaster as SonnerToaster } from 'sonner'

export function AppToaster() {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      expand
      visibleToasts={4}
      richColors
      toastOptions={{
        duration: 4500,
        classNames: {
          toast:
            '!rounded-card !border !border-border !font-sans !shadow-card-sm',
          title: '!text-sm !font-semibold',
          description: '!text-sm',
          actionButton:
            '!rounded-button !bg-main !px-3 !py-1.5 !text-main-foreground',
          cancelButton:
            '!rounded-button !bg-bg-muted !px-3 !py-1.5 !text-fg',
          closeButton: '!border-border !bg-surface !text-fg',
        },
      }}
    />
  )
}
