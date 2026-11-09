import { randomUUID } from 'node:crypto'

import { IdGeneratorContract } from '#services/id-generator/id-generator.contract'

/** The system generator: uuid v4 from `node:crypto`. */
export default class CryptoIdGeneratorService extends IdGeneratorContract {
  uuid(): string {
    return randomUUID()
  }
}
