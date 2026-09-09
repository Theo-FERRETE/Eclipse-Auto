jest.mock('../../models/reservationModel')

const reservationModel = require('../../models/reservationModel')
const { expireReservations, startExpirationJob } = require('../../jobs/expireReservations')

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  console.log.mockRestore()
  console.error.mockRestore()
})

describe('expireReservations', () => {
  it('ne log rien quand aucun essai n\'a expiré', async () => {
    reservationModel.expireCompleted.mockResolvedValue({ data: [], error: null })

    await expireReservations()

    expect(console.log).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('log le nombre d\'essais remis disponibles', async () => {
    reservationModel.expireCompleted.mockResolvedValue({
      data: [{ id: 'r1', vehicle_id: 'v1' }, { id: 'r2', vehicle_id: 'v2' }],
      error: null,
    })

    await expireReservations()

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('2 essai(s)'))
  })

  it('log une erreur sans lever d\'exception si la requête échoue', async () => {
    reservationModel.expireCompleted.mockResolvedValue({ data: null, error: { message: 'boom' } })

    await expect(expireReservations()).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Erreur'), 'boom')
  })
})

describe('startExpirationJob', () => {
  it('vérifie immédiatement puis toutes les intervalMs', () => {
    jest.useFakeTimers()
    reservationModel.expireCompleted.mockResolvedValue({ data: [], error: null })

    const handle = startExpirationJob(1000)
    expect(reservationModel.expireCompleted).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(3000)
    expect(reservationModel.expireCompleted).toHaveBeenCalledTimes(4)

    clearInterval(handle)
    jest.useRealTimers()
  })
})
