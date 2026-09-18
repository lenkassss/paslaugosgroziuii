import type { ComponentType } from 'react'
import { template as bookingConfirmation } from './booking-confirmation'
import { template as bookingReminder } from './booking-reminder'
import { template as reviewRequest } from './review-request'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'booking-confirmation': bookingConfirmation,
  'booking-reminder': bookingReminder,
  'review-request': reviewRequest,
}
