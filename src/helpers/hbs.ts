import { join } from 'path'
import * as hbs from 'hbs'

export function registerHbsHelpers() {
  hbs.registerHelper('includes', function (arr: any[], item: any) {
    return arr && arr.includes(item)
  })

  hbs.registerHelper('formatPrice', function (price: number) {
    return 'Rp ' + Number(price).toLocaleString('id-ID')
  })

  hbs.registerHelper('formatDate', function (date: Date) {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  })

  hbs.registerHelper('gt', function (a: number, b: number) {
    return a > b
  })

  hbs.registerHelper('lt', function (a: number, b: number) {
    return a < b
  })

  hbs.registerHelper('add', function (a: number, b: number) {
    return a + b
  })

  hbs.registerHelper('subtract', function (a: number, b: number) {
    return a - b
  })
}

export function registerHbsPartials(viewsDir: string) {
  hbs.registerPartials(join(viewsDir, 'partials'))
}
