import StorageModel from '#models/storage'
import UserModel from '#models/user'

/**
 * What was left stored in the database, read for the "saved" / "not saved" assertion
 * (`_standards/backend.md` §7). A `features/` spec does not import a model
 * (`architecture.md` §2): the e2e checks the state through here, and seeds through
 * the `database/factories/` factories.
 *
 * `x(id)` returns `null` when the row does not exist; `xOrFail` fails the test.
 *
 * Extension point (KIT.md §3.4): the project adds one reader per model it has, and
 * the kit specs only rely on what is below.
 */
export class Stored {
  static storage(id: string) {
    return StorageModel.find(id)
  }

  static storageOrFail(id: string) {
    return StorageModel.findOrFail(id)
  }

  static storages() {
    return StorageModel.all()
  }

  /** Points the user's avatar at the file, as saving the profile does. */
  static async attachAvatar(userId: string, storageId: string): Promise<void> {
    await UserModel.query().where('id', userId).update({ avatarId: storageId })
  }
}
