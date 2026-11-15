import {
  EmailChangeContract,
  type EmailChangeDelivery,
} from '#services/email-change/email-change.contract'

/** The double for the unit test: it keeps what was delivered, and `available: false` is the deploy without e-mail. */
export class EmailChangeFake extends EmailChangeContract {
  readonly delivered: EmailChangeDelivery[] = []

  constructor(private readonly available = true) {
    super()
  }

  isAvailable(): boolean {
    return this.available
  }

  deliver(delivery: EmailChangeDelivery): Promise<void> {
    this.delivered.push(delivery)

    return Promise.resolve()
  }
}
