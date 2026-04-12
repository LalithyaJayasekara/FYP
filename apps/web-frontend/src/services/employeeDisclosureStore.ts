export type EmployeeLearningDisclosure = {
  email: string
  awareOfLearningDisorder: boolean
  reportFileName?: string
  reportImageDataUrl?: string
  submittedAt: string
}

const DISCLOSURE_KEY = 'carelink.employee.disclosures.v1'

function readStore(): Record<string, EmployeeLearningDisclosure> {
  const raw = window.localStorage.getItem(DISCLOSURE_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, EmployeeLearningDisclosure>
    if (!parsed || typeof parsed !== 'object') {
      return {}
    }
    return parsed
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, EmployeeLearningDisclosure>): void {
  window.localStorage.setItem(DISCLOSURE_KEY, JSON.stringify(store))
}

export function getEmployeeDisclosure(email: string): EmployeeLearningDisclosure | null {
  const normalizedEmail = email.trim().toLowerCase()
  const store = readStore()
  return store[normalizedEmail] ?? null
}

export function saveEmployeeDisclosure(record: EmployeeLearningDisclosure): void {
  const normalizedEmail = record.email.trim().toLowerCase()
  const store = readStore()
  store[normalizedEmail] = {
    ...record,
    email: normalizedEmail,
  }
  writeStore(store)
}

export function getAllEmployeeDisclosures(): EmployeeLearningDisclosure[] {
  const store = readStore()
  return Object.values(store).sort((left, right) =>
    right.submittedAt.localeCompare(left.submittedAt),
  )
}
