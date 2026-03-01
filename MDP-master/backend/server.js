const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

let logs = []

app.get('/', (req, res) => {
    res.send("Medicine Dispenser Backend Running")
})

app.post('/dispense', (req, res) => {
    const data = req.body
    logs.push(data)
    console.log("New Dispense Log:", data)
    res.json({ message: "Log saved successfully" })
})

app.get('/logs', (req, res) => {
    res.json(logs)
})

let dispenseCommand = false

app.post('/command/dispense', (req, res) => {
    dispenseCommand = true
    res.json({ message: "Dispense command sent" })
})

app.get('/command', (req, res) => {
    res.json({ dispense: dispenseCommand })
    dispenseCommand = false
})

app.listen(5000, () => {
    console.log("Server running on port 5000")
})