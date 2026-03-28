/**
 * Resolves translated fields on a serialized model object.
 *
 * For each field name in `fields`, if `locale` is `'en'` and the object has
 * a non-empty `${field}En` property, the `field` value is replaced with it.
 * The `${field}En` key is always removed from the result.
 */
export function localize(
  obj: Record<string, any>,
  locale: string,
  fields: string[]
): Record<string, any> {
  const result = { ...obj }

  for (const field of fields) {
    const enKey = `${field}En`

    if (locale === 'en' && result[enKey]) {
      result[field] = result[enKey]
    }

    delete result[enKey]
  }

  return result
}

/**
 * Localizes an array of serialized objects.
 */
export function localizeAll(
  items: Record<string, any>[],
  locale: string,
  fields: string[]
): Record<string, any>[] {
  return items.map((item) => localize(item, locale, fields))
}
