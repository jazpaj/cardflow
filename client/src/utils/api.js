const BASE = '/api'

export async function createBoard(name) {
  const res = await fetch(`${BASE}/boards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  return res.json()
}

export async function getBoard(id) {
  const res = await fetch(`${BASE}/boards/${id}`)
  if (!res.ok) return null
  return res.json()
}
