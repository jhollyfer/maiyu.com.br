/**
 * What the city refuses, as a fact (`_standards/domain.md` §2). The box of a city is the area its
 * tenants' maps open on and the geographic checks accept: south below north, west of east, and the
 * center inside it.
 */
export type CityError = { readonly code: 'CITY_BOUNDS_INVALID' }
