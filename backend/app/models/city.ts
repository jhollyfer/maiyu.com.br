import { CitySchema } from '#database/schema'

/** A platform city (DECISIONS.md #390). Global: no tenant scope reaches this table. */
export default class City extends CitySchema {}
