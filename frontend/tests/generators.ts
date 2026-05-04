import fc from 'fast-check'

export const emailArbitrary = fc.emailAddress()
export const futureDateArbitrary = fc.date({
  min: new Date(Date.now() + 24 * 60 * 60 * 1000),
  max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
})
