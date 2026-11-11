import { describe, expect, it } from 'vitest'

import { ValidationFixture } from '../../validation-fixtures.js'
import { AdministratorContactPaginateValidator } from './contacts.validator.js'

describe('AdministratorContactPaginateValidator', () => {
  it('when the query is empty, it accepts it', () => {
    expect(AdministratorContactPaginateValidator.safeParse({}).success).toBe(
      true,
    )
  })

  it('when the status is pending or answered, it accepts, and any other it refuses', () => {
    for (const status of ['pending', 'answered']) {
      expect(
        AdministratorContactPaginateValidator.safeParse({ status }).success,
      ).toBe(true)
    }

    const refused = AdministratorContactPaginateValidator.safeParse({
      status: 'archived',
    })

    expect(ValidationFixture.fields(refused)).toEqual(['status'])
  })

  it('when the search is 100 characters, it accepts, and at 101 it refuses', () => {
    const accepted = AdministratorContactPaginateValidator.safeParse({
      search: 'a'.repeat(100),
    })
    const refused = AdministratorContactPaginateValidator.safeParse({
      search: 'a'.repeat(101),
    })

    expect(accepted.success).toBe(true)
    expect(ValidationFixture.fields(refused)).toEqual(['search'])
  })

  it('when the page size passes 100, it refuses it', () => {
    const refused = AdministratorContactPaginateValidator.safeParse({
      perPage: 101,
    })

    expect(ValidationFixture.fields(refused)).toEqual(['perPage'])
  })
})
