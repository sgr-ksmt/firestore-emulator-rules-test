import * as ftest from '@firebase/testing'
import FirestoreTestProvider from './firestoreTestProvider'

const testName = 'firestore-emulator-example'
const provider = new FirestoreTestProvider(testName)

function getUsersRef(db: firebase.firestore.Firestore) {
  return db.collection('users')
}

function getRoomsRef(db: firebase.firestore.Firestore) {
  return db.collection('rooms')
}

describe(testName, () => {
  beforeEach(async () => {
    provider.increment()
    await provider.loadRules()
  })

  afterEach(async () => {
    await provider.cleanup()
  })

  describe('users collection test', () => {
    test('require users to log in before creating a profile', async () => {
      const db = provider.getFirestoreWithAuth(null)
      const profile = getUsersRef(db).doc('alice')
      await ftest.assertFails(profile.set({ birthday: 'January 1' }))
    })

    test('should let anyone create their own profile', async () => {
      const db = provider.getFirestoreWithAuth({ uid: 'alice' })
      const profile = getUsersRef(db).doc('alice')
      await ftest.assertSucceeds(profile.set({ birthday: 'January 1' }))
    })

    test('should let anyone read any profile', async () => {
      const db = provider.getFirestoreWithAuth(null)
      const profile = getUsersRef(db).doc('alice')
      await ftest.assertSucceeds(profile.get())
    })
  })

  describe('rooms collection test', () => {
    test('should let anyone create a room', async () => {
      const db = provider.getFirestoreWithAuth({ uid: 'alice' })
      const room = getRoomsRef(db).doc('firebase')
      await ftest.assertSucceeds(room.set({
        owner: 'alice',
        topic: 'All Things Firebase',
      }))
    })

    test('should force people to name themselves as room owner when creating a room', async () => {
      const db = provider.getFirestoreWithAuth({ uid: 'alice' })
      const room = getRoomsRef(db).doc('firebase')
      await ftest.assertFails(room.set({
        owner: 'scott',
        topic: 'Firebase Rocks!',
      }))
    })

    test('should not let one user steal a room from another user', async () => {
      const alice = provider.getFirestoreWithAuth({ uid: 'alice' })
      const bob = provider.getFirestoreWithAuth({ uid: 'bob' })

      await ftest.assertSucceeds(getRoomsRef(bob).doc('snow').set({
        owner: 'bob',
        topic: 'All Things Snowboarding',
      }))

      await ftest.assertFails(getRoomsRef(alice).doc('snow').set({
        owner: 'alice',
        topic: 'skiing > snowboarding',
      }))
    })
  })
})
