const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const qr = require('qrcode');
const app = express();

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: '',
    user: '',
    password: '',
    database: '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL database');
        connection.release();
    } catch (err) {
        console.error('Error connecting to the database:', err);
    }
}
testConnection();

app.get('/events', async (req, res) => {
    try {
        const query = 'SELECT * FROM events';
        const [results] = await pool.query(query);
        res.json(results);
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).send('Error fetching data');
    }
});

app.post('/generate-qr', (req, res) => {
    const { amount } = req.body;
    const upiId = 'somr63082@oksbi';
    const upiLink = `upi://pay?pa=${upiId}&am=${amount}&cu=INR`;
    
    qr.toDataURL(upiLink, (err, url) => {
        if (err) {
            console.error('Error generating QR code:', err);
            res.status(500).send('Error generating QR code');
        } else {
            res.json({ qrCodeUrl: url });
        }
    });
});

app.post('/verify-registration', async (req, res) => {
    const {firstName, lastName, email, phone, organization, state, selectedEvents, bandId } = req.body;
    let connection;
    
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Fetch the maximum UID from the attendees table
        const [maxUidResult] = await connection.query('SELECT MAX(UID) as maxUid FROM attendees');
        const maxUid = maxUidResult[0].maxUid || 0;  // If table is empty, start from 0
        const newUid = maxUid + 3;  // Generate the next UID by adding 3

        const insertAttendeeQuery = `
            INSERT INTO attendees 
            (UID, FirstName, LastName, Email, ContactNumber, InstituteName, State, BandID) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await connection.query(insertAttendeeQuery, [
            newUid,
            firstName,
            lastName,
            email,
            phone,
            organization || 'Not provided', // Use 'Not provided' if organization is null or undefined
            state,
            bandId,
        ]);

        const participatingInsertQuery = `
            INSERT INTO participating (EventID, UserID, attended)
            VALUES (?, ?, 0)
        `;

        for (const eventId of selectedEvents) {
            await connection.query(participatingInsertQuery, [eventId, newUid]);
        }

        await connection.commit();
        
        res.json({
            success: true,
            userId: newUid,
            bandId: bandId,
            message: 'Registration and event participation recorded successfully'
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});