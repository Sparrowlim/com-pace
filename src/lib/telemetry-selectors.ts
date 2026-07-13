import { idbStorage } from '../storage/idb-storage'
import type { Task } from '../types/task'
import type { Block } from '../types/block'
import type { Prediction } from '../types/prediction'
import type { Session } from '../types/session'

// 내부 지표(SPEC §10 · CLAUDE.md §9) — 관측 전용, 사용자 비노출, 어떤 UI/개입도 촉발하지
// 않는다(와이어 영향 0). 루프가 이미 저장한 Task/Block/Prediction/Session만 읽고 새로 묻지
// 않는다. 이 파일을 import하는 컴포넌트는 하나도 없어야 한다(가드레일 어서션, README §0-1 ⑥).
export interface DailyTelemetry {
  date: string
  tasksCreated: number
  blocksStarted: number
  startSuccessRate: number
  predictionsResolved: number
  predictionsHit: number
  predictionHitRate: number
  sessionsStarted: number
  dischargeSessions: number
  dischargeEntryRate: number
}

function enumerateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  let cursor = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T00:00:00.000Z`)
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  }
  return dates
}

function groupByDate<T extends { date: string }>(records: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>()
  for (const record of records) {
    const bucket = grouped.get(record.date)
    if (bucket) {
      bucket.push(record)
    } else {
      grouped.set(record.date, [record])
    }
  }
  return grouped
}

// 분모 0인 날은 NaN 대신 0을 돌려준다 — 다운스트림에서 분기 없이 number로 다루기 위함.
function safeRate(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator
}

async function resolvedPredictionsFor(blocks: Block[]): Promise<Prediction[]> {
  const predictions = await Promise.all(
    blocks.map((block) => idbStorage.findById<Prediction>('predictions', block.id)),
  )
  return predictions.filter(
    (prediction): prediction is Prediction => prediction !== null && prediction.actual !== null,
  )
}

function computeStartSuccessRate(tasksOnDate: Task[], blocksOnDate: Block[]): number {
  const taskIdsCreatedToday = new Set(tasksOnDate.map((task) => task.id))
  const taskIdsStartedToday = new Set(blocksOnDate.map((block) => block.taskId))
  const startedFromToday = [...taskIdsCreatedToday].filter((id) => taskIdsStartedToday.has(id))
  return safeRate(startedFromToday.length, tasksOnDate.length)
}

export async function computeDailyTelemetry(
  startDate: string,
  endDate: string,
): Promise<DailyTelemetry[]> {
  const [tasks, blocks, sessions] = await Promise.all([
    idbStorage.findByDateRange<Task>('tasks', startDate, endDate),
    idbStorage.findByDateRange<Block>('blocks', startDate, endDate),
    idbStorage.findByDateRange<Session>('sessions', startDate, endDate),
  ])
  const tasksByDate = groupByDate(tasks)
  const blocksByDate = groupByDate(blocks)
  const sessionsByDate = groupByDate(sessions)

  return Promise.all(
    enumerateDates(startDate, endDate).map(async (date) => {
      const tasksOnDate = tasksByDate.get(date) ?? []
      const blocksOnDate = blocksByDate.get(date) ?? []
      const sessionsOnDate = sessionsByDate.get(date) ?? []
      const resolved = await resolvedPredictionsFor(blocksOnDate)
      const hit = resolved.filter((prediction) => prediction.guess === prediction.actual)
      const dischargeSessions = sessionsOnDate.filter((session) => session.dischargeMode)

      return {
        date,
        tasksCreated: tasksOnDate.length,
        blocksStarted: blocksOnDate.length,
        startSuccessRate: computeStartSuccessRate(tasksOnDate, blocksOnDate),
        predictionsResolved: resolved.length,
        predictionsHit: hit.length,
        predictionHitRate: safeRate(hit.length, resolved.length),
        sessionsStarted: sessionsOnDate.length,
        dischargeSessions: dischargeSessions.length,
        dischargeEntryRate: safeRate(dischargeSessions.length, sessionsOnDate.length),
      }
    }),
  )
}
