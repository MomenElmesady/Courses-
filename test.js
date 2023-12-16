const { MongoClient } = require("mongodb")

const url = "mongodb+srv://momenashraf482003:VMgJyNdkjakmJnSz@cluster0.j9aiiny.mongodb.net/?retryWrites=true&w=majority"

const client = new MongoClient(url)

const main = async () => {
    await client.connect()
    console.log("connected")
}

main()