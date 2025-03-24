import 'dotenv/config'
import connectDB from './db/index.js';
import express from 'express';

const app = express()

connectDB()
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})
