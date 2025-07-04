import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

const connectToDb=()=>{
    mongoose.connect(process.env.MONGOURI)
    .then(() => {
        console.log('Connected to MongoDB');
      })
      .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
      });
}

connectToDb()