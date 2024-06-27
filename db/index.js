
const mongoose = require('mongoose')

//mongodb+srv://alumni:<password>@cluster0.tqky1az.mongodb.net/?retryWrites=true&w=majority

mongoose.connect('mongodb://testUser:testPassword@54.242.180.165:27017/test', { useNewUrlParser: true, useUnifiedTopology: true })
    .catch(e => {
        console.error('Connection error', e.message)
    })

const db = mongoose.connection

module.exports = db;
// mongodb://adminUser:securePassword@34.230.70.220:27017/admin