const BASE_URL = "http://localhost:5000"

export const checkBackend = async () => {
  const res = await fetch(`${BASE_URL}/`)
  return res.text()
}

export const sendDispenseLog = async (data: any) => {
  const res = await fetch(`${BASE_URL}/dispense`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  return res.json()
}

export const getLogs = async () => {
  const res = await fetch(`${BASE_URL}/logs`)
  return res.json()
}