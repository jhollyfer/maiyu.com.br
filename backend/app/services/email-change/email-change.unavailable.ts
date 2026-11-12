import { EmailChangeContract } from '#services/email-change/email-change.contract'

/**
 * The binding of a project that has no e-mail block: there is nowhere to send the token, so the
 * owner cannot change the e-mail by themselves (only the administrator, in the users CRUD).
 */
export default class EmailChangeUnavailable extends EmailChangeContract {
  isAvailable(): boolean {
    return false
  }

  deliver(): Promise<void> {
    return Promise.reject(
      new Error('e-mail change delivered while it is unavailable'),
    )
  }
}
