export class PrismaClient {
  user = {
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    update: () => Promise.resolve(null),
    delete: () => Promise.resolve(null),
  }
  category = this.user
  product = this.user
  productCategory = this.user
  $connect = () => Promise.resolve()
  $disconnect = () => Promise.resolve()
}

export default PrismaClient
