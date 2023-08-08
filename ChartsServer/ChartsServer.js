const express = require('express');
const cors = require('cors');

const { MongoClient, ServerApiVersion } = require('mongodb');

// const dotenv = require('dotenv');
// const path = require('path');

// const envPath = path.resolve(__dirname, '.env');

// dotenv.config({ path: envPath });

const password = encodeURIComponent(process.env.PASSWORD);

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;
const MONGO_URI = `mongodb+srv://asterace:${password}@cluster0.ivetzzz.mongodb.net`;

const mongoClient = new MongoClient(MONGO_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const { charts } = require('./chartsData.js');

mongoClient.connect(async (err) => {
    if (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    } else {
        console.log('Connected to MongoDB successfully!');
        try {
            const database = mongoClient.db('charts_db');
            const chartItemsCollection = database.collection('chartItems');

            await database.command({ ping: 1 });

            const existingDataCount = await chartItemsCollection.countDocuments();
            if (existingDataCount === 0) {
                await chartItemsCollection.insertMany(charts);
                console.log('Data inserted into MongoDB');
            } else {
                console.log('Data already exists in MongoDB. Not inserting again.');
            }
        } catch (error) {
            console.error('Error accessing MongoDB:', error);
        } finally {
            await mongoClient.close();
        }
    }
});

async function fetchChartItems() {
    try {
        await mongoClient.connect();

        const database = mongoClient.db('charts_db');
        const chartItemsCollection = database.collection('chartItems');

        const items = await chartItemsCollection.find().toArray();

        return items;
    } catch (error) {
        console.error('Error fetching data from MongoDB:', error);
        throw error;
    } finally {
        await mongoClient.close();
    }
}

app.use(express.json());

app.get('/api/items', async (req, res) => {
    try {
        const items = await fetchChartItems();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
