import factory from '@adonisjs/lucid/factories'

import { LOCALE } from '@maiyu/shared'

import Contact from '#models/contact'

/**
 * A pending contact message (`answeredAt` null). A spec that wants it answered or old asks
 * for it through `merge({ answeredAt })` or `merge({ createdAt })`.
 */
export const ContactFactory = factory
  .define(Contact, ({ faker }) => ({
    name: faker.person.fullName().slice(0, 120),
    email: faker.internet.email().toLowerCase(),
    message: faker.lorem.sentences(2),
    locale: LOCALE.PT_BR,
  }))
  .build()
